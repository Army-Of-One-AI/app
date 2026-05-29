import { Module } from '@nestjs/common';
import { ModelProvidersController } from './model-providers.controller';
import { ModelProvidersService } from './model-providers.service';
import { OllamaService } from './ollama.service';

@Module({
  controllers: [ModelProvidersController],
  providers: [ModelProvidersService, OllamaService],
  exports: [ModelProvidersService, OllamaService],
})
export class ModelProvidersModule {}
