import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsBooleanString()
  SYNC_SCHEMA?: string;

  @IsOptional()
  @IsString()
  ML_SERVICE_URL?: string;

  @IsString()
  DATABASE_HOST!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT?: number;

  @IsString()
  DATABASE_USER!: string;

  @IsString()
  DATABASE_PASSWORD!: string;

  @IsString()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message:
      'DATABASE_NAME must be a simple Postgres identifier (e.g. dental_neu_ai)',
  })
  DATABASE_NAME!: string;

  @IsOptional()
  @IsBooleanString()
  DATABASE_SSL?: string;

  @IsOptional()
  @IsBooleanString()
  DATABASE_ENSURE?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
    message: 'DATABASE_MAINTENANCE_NAME must be a simple Postgres identifier',
  })
  DATABASE_MAINTENANCE_NAME?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration: ${errors
        .map((e) => Object.values(e.constraints ?? {}).join(', '))
        .join('; ')}`,
    );
  }

  return validated;
}
