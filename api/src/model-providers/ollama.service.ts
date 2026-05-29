/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ModelProviderType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OllamaChatMessage = {
  role: 'system' | 'user';
  content: string;
};

export type OllamaRole =
  | 'PRODUCT_OWNER'
  | 'PM'
  | 'DESIGNER'
  | 'DEVELOPER'
  | 'QC'
  | 'LIGHTWEIGHT';

export type OllamaGenerationMode = 'FAST' | 'DEEP';

type OllamaChatOptions = {
  role: OllamaRole;
  generationMode?: OllamaGenerationMode;
};

type OllamaProviderConfig = {
  baseUrl: string;
  modelName: string;
};

type OllamaChatResponse = {
  message: {
    content: string;
  };
};

type JsonParseResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      error: string;
    };

const recommendedLocalModels: Record<OllamaRole, string> = {
  PRODUCT_OWNER: 'llama3.2',
  PM: 'llama3.2',
  DESIGNER: 'gemma2:9b',
  DEVELOPER: 'llama3.2',
  QC: 'llama3.2',
  LIGHTWEIGHT: 'gemma2:2b',
};

const fallbackModel = 'llama3.2';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOllamaChatResponse(value: unknown): value is OllamaChatResponse {
  if (!isRecord(value)) return false;
  const message = value.message;
  if (!isRecord(message)) return false;
  return typeof message.content === 'string';
}

@Injectable()
export class OllamaService {
  constructor(private readonly prisma: PrismaService) {}

  async chatJson(
    messages: OllamaChatMessage[],
    options: OllamaChatOptions,
  ): Promise<unknown> {
    const provider = await this.getProviderConfig(options.role);
    const endpoint = `${provider.baseUrl.replace(/\/$/, '')}/api/chat`;
    const timeoutMs = options.generationMode === 'DEEP' ? 180_000 : 90_000;
    const strictMessages = this.withStrictJsonInstruction(messages);
    const firstContent = await this.sendChatRequest({
      endpoint,
      provider,
      messages: strictMessages,
      timeoutMs,
      temperature: 0.2,
    });
    const firstParse = this.parseJson(firstContent);
    if (firstParse.ok) return firstParse.value;

    this.logParseFailure(firstContent, firstParse.error);

    const retryContent = await this.sendChatRequest({
      endpoint,
      provider,
      messages: this.withRetryInstruction(strictMessages),
      timeoutMs,
      temperature: 0,
    });
    const retryParse = this.parseJson(retryContent);
    if (retryParse.ok) return retryParse.value;

    this.logParseFailure(retryContent, retryParse.error);
    throw new BadRequestException(
      'Ollama returned invalid JSON. Try Fast mode or a stronger model.',
    );
  }

  private async getProviderConfig(role: OllamaRole): Promise<OllamaProviderConfig> {
    const provider = await this.prisma.modelProvider.findFirst({
      where: { type: ModelProviderType.OLLAMA },
      orderBy: { created_at: 'desc' },
    });

    return {
      baseUrl: provider?.base_url ?? 'http://localhost:11434',
      modelName: provider?.model_name ?? recommendedLocalModels[role] ?? fallbackModel,
    };
  }

  private async sendChatRequest({
    endpoint,
    provider,
    messages,
    timeoutMs,
    temperature,
  }: {
    endpoint: string;
    provider: OllamaProviderConfig;
    messages: OllamaChatMessage[];
    timeoutMs: number;
    temperature: number;
  }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: provider.modelName,
          stream: false,
          messages,
          format: 'json',
          options: {
            temperature,
          },
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (this.isAbortError(error)) {
        throw new BadRequestException(
          'Local model took too long. Try Fast mode, a smaller model, or a cloud provider.',
        );
      }
      throw new BadRequestException(
        `Could not reach Ollama at ${provider.baseUrl}. ${this.errorMessage(error)}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Ollama request failed with status ${response.status}.`,
      );
    }

    const payload = (await response.json()) as unknown;
    if (!isOllamaChatResponse(payload)) {
      throw new BadRequestException('Ollama returned an unexpected response.');
    }

    return payload.message.content;
  }

  private parseJson(content: string): JsonParseResult {
    const raw = content.trim();
    const rawParse = this.tryParse(raw);
    if (rawParse.ok) return rawParse;

    const withoutFences = this.removeCodeFences(raw);
    const extracted = this.extractFirstJsonObject(withoutFences);
    if (!extracted) return rawParse;

    const extractedParse = this.tryParse(extracted);
    if (extractedParse.ok) return extractedParse;

    return extractedParse;
  }

  private tryParse(content: string): JsonParseResult {
    try {
      return { ok: true, value: JSON.parse(content) as unknown };
    } catch (error) {
      return { ok: false, error: this.errorMessage(error) };
    }
  }

  private removeCodeFences(content: string) {
    return content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  private extractFirstJsonObject(content: string) {
    const start = content.indexOf('{');
    if (start < 0) return undefined;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < content.length; index += 1) {
      const char = content[index];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      if (depth === 0) return content.slice(start, index + 1);
    }

    return undefined;
  }

  private withStrictJsonInstruction(messages: OllamaChatMessage[]) {
    const instruction =
      'Return ONLY valid JSON. No markdown. No explanation. No code fences.';
    const systemMessage = messages.find((message) => message.role === 'system');
    if (!systemMessage) {
      return [{ role: 'system' as const, content: instruction }, ...messages];
    }

    return messages.map((message) =>
      message === systemMessage
        ? { ...message, content: `${message.content}\n${instruction}` }
        : message,
    );
  }

  private withRetryInstruction(messages: OllamaChatMessage[]) {
    return [
      {
        role: 'system' as const,
        content:
          'Return ONLY one valid JSON object. No markdown. No explanation. No code fences. Use double quotes for every key and string value.',
      },
      ...messages.filter((message) => message.role !== 'system'),
    ];
  }

  private logParseFailure(content: string, error: string) {
    if (process.env.NODE_ENV === 'production') return;
    console.debug('Ollama JSON parse failed:', {
      error,
      rawOutputPreview: content.slice(0, 800),
    });
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown connection error.';
  }

  private isAbortError(error: unknown) {
    return error instanceof Error && error.name === 'AbortError';
  }
}
