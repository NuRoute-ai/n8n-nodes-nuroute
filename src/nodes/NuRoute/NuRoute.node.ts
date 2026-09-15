import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface MessageValue {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

export class NuRoute implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'NuRoute',
    name: 'nuRoute',
    icon: 'file:nuroute.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["model"]}}',
    description: 'Send a chat completion request through your NuRoute gateway',
    defaults: { name: 'NuRoute' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'nuRouteApi', required: true }],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'string',
        default: 'auto',
        description:
          '"auto" lets NuRoute\'s routing engine pick the best model for this request, or specify a model ID directly (e.g. gpt-4o, claude-sonnet-4-6)',
      },
      {
        displayName: 'Messages',
        name: 'messages',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true, sortable: true },
        placeholder: 'Add Message',
        default: { values: [{ role: 'user', content: '' }] },
        options: [
          {
            name: 'values',
            displayName: 'Values',
            values: [
              {
                displayName: 'Role',
                name: 'role',
                type: 'options',
                options: [
                  { name: 'System', value: 'system' },
                  { name: 'User', value: 'user' },
                  { name: 'Assistant', value: 'assistant' },
                ],
                default: 'user',
              },
              {
                displayName: 'Content',
                name: 'content',
                type: 'string',
                typeOptions: { rows: 3 },
                default: '',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Simplify Output',
        name: 'simplify',
        type: 'boolean',
        default: true,
        description:
          "Whether to return only the assistant's reply text and basic metadata instead of the full API response",
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Temperature',
            name: 'temperature',
            type: 'number',
            typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 1 },
            default: 1,
            description: 'Sampling temperature, 0-2. Higher = more random.',
          },
          {
            displayName: 'Max Tokens',
            name: 'maxTokens',
            type: 'number',
            typeOptions: { minValue: 1 },
            default: 2048,
            description: 'Maximum tokens in the completion',
          },
          {
            displayName: 'Provider',
            name: 'provider',
            type: 'string',
            default: '',
            description:
              'Force a specific provider (e.g. openai, anthropic). Leave empty to let NuRoute choose — combined with Model "auto", this picks the best model from that provider.',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const model = this.getNodeParameter('model', i) as string;
        const messageValues = this.getNodeParameter('messages.values', i, []) as MessageValue[];
        const simplify = this.getNodeParameter('simplify', i) as boolean;
        const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as {
          temperature?: number;
          maxTokens?:   number;
          provider?:    string;
        };

        if (messageValues.length === 0) {
          throw new NodeOperationError(this.getNode(), 'At least one message is required', { itemIndex: i });
        }

        const credentials = await this.getCredentials('nuRouteApi');
        const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');

        const body: Record<string, unknown> = {
          model,
          messages: messageValues.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
        };
        if (additionalOptions.temperature !== undefined) body.temperature = additionalOptions.temperature;
        if (additionalOptions.maxTokens   !== undefined) body.max_tokens  = additionalOptions.maxTokens;
        if (additionalOptions.provider)                  body.provider   = additionalOptions.provider;

        const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'nuRouteApi', {
          method: 'POST',
          url:    `${baseUrl}/v1/chat/completions`,
          body,
          json:   true,
        })) as {
          model:   string;
          choices: Array<{ message: { role: string; content: string }; finish_reason: string }>;
          usage:   { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };

        const output = simplify
          ? {
              content:      response.choices?.[0]?.message?.content ?? '',
              model:        response.model,
              finishReason: response.choices?.[0]?.finish_reason,
              usage:        response.usage,
            }
          : response;

        returnData.push({ json: output, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
