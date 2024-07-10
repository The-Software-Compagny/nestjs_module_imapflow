import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { ImapflowModuleAsyncOptions, ImapflowModuleOptions, ImapflowModuleOptionsFactory } from './imapflow.interfaces'
import { createImapflowConnection, getImapflowConnectionToken, getImapflowOptionsToken } from './imapflow.utils'

@Global()
@Module({})
export class ImapflowCoreModule {
  public static forRoot(options: ImapflowModuleOptions, connection?: string): DynamicModule {
    const imapflowOptionsProvider: Provider = {
      provide: getImapflowOptionsToken(connection),
      useValue: options,
    }

    const imapflowConnectionProvider: Provider = {
      provide: getImapflowConnectionToken(connection),
      useValue: createImapflowConnection(options),
    }

    return {
      module: ImapflowCoreModule,
      providers: [imapflowOptionsProvider, imapflowConnectionProvider],
      exports: [imapflowOptionsProvider, imapflowConnectionProvider],
    }
  }

  public static forRootAsync(options: ImapflowModuleAsyncOptions, connection: string): DynamicModule {
    const imapflowConnectionProvider: Provider = {
      provide: getImapflowConnectionToken(connection),
      useFactory(options: ImapflowModuleOptions) {
        return createImapflowConnection(options)
      },
      inject: [getImapflowOptionsToken(connection)],
    }

    return {
      module: ImapflowCoreModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options, connection), imapflowConnectionProvider],
      exports: [imapflowConnectionProvider],
    }
  }

  public static createAsyncProviders(options: ImapflowModuleAsyncOptions, connection?: string): Provider[] {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options, connection)]
    }

    return [
      this.createAsyncOptionsProvider(options, connection),
      { provide: options.useClass, useClass: options.useClass },
    ]
  }

  public static createAsyncOptionsProvider(options: ImapflowModuleAsyncOptions, connection?: string): Provider {
    if (!(options.useExisting || options.useFactory || options.useClass)) {
      throw new Error('Invalid configuration. Must provide useFactory, useClass or useExisting')
    }

    if (options.useFactory) {
      return {
        provide: getImapflowOptionsToken(connection),
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }

    return {
      provide: getImapflowOptionsToken(connection),
      async useFactory(optionsFactory: ImapflowModuleOptionsFactory): Promise<ImapflowModuleOptions> {
        // noinspection ES6RedundantAwait
        return await optionsFactory.createImapflowModuleOptions()
      },
      inject: [options.useClass || options.useExisting],
    }
  }
}
