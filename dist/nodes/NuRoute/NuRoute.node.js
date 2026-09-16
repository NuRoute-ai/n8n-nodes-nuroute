"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NuRoute = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class NuRoute {
    description = {
        displayName: 'NuRoute',
        name: 'nuRoute',
        icon: { light: 'file:nuroute.svg', dark: 'file:nuroute.svg' },
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["model"]}}',
        description: 'Send a chat completion request through your NuRoute gateway',
        defaults: { name: 'NuRoute' },
        usableAsTool: true,
        inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        credentials: [{ name: 'nuRouteApi', required: true }],
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'string',
                default: 'auto',
                description: '"auto" lets NuRoute\'s routing engine pick the best model for this request, or specify a model ID directly (e.g. gpt-4o, claude-sonnet-4-6)',
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
                description: "Whether to return only the assistant's reply text and basic metadata instead of the full API response",
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
                        description: 'Force a specific provider (e.g. openai, anthropic). Leave empty to let NuRoute choose — combined with Model "auto", this picks the best model from that provider.',
                    },
                ],
            },
        ],
    };
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const model = this.getNodeParameter('model', i);
                const messageValues = this.getNodeParameter('messages.values', i, []);
                const simplify = this.getNodeParameter('simplify', i);
                const additionalOptions = this.getNodeParameter('additionalOptions', i, {});
                if (messageValues.length === 0) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'At least one message is required', { itemIndex: i });
                }
                const credentials = await this.getCredentials('nuRouteApi');
                const baseUrl = credentials.baseUrl.replace(/\/+$/, '');
                const body = {
                    model,
                    messages: messageValues.map((m) => ({ role: m.role, content: m.content })),
                    stream: false,
                };
                if (additionalOptions.temperature !== undefined)
                    body.temperature = additionalOptions.temperature;
                if (additionalOptions.maxTokens !== undefined)
                    body.max_tokens = additionalOptions.maxTokens;
                if (additionalOptions.provider)
                    body.provider = additionalOptions.provider;
                const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'nuRouteApi', {
                    method: 'POST',
                    url: `${baseUrl}/v1/chat/completions`,
                    body,
                    json: true,
                }));
                const output = simplify
                    ? {
                        content: response.choices?.[0]?.message?.content ?? '',
                        model: response.model,
                        finishReason: response.choices?.[0]?.finish_reason,
                        usage: response.usage,
                    }
                    : response;
                returnData.push({ json: output, pairedItem: { item: i } });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
                    continue;
                }
                // The empty-messages check above already throws NodeOperationError — re-wrap (not
                // re-throw) to satisfy n8n's lint rule against bare `throw <caughtVar>`, which flags
                // that pattern regardless of any instanceof narrowing. Anything else came from the
                // HTTP call and needs wrapping for n8n to render it as a proper API error instead of
                // a raw stack trace.
                if (error instanceof n8n_workflow_1.NodeOperationError) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
                }
                throw new n8n_workflow_1.NodeApiError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.NuRoute = NuRoute;
//# sourceMappingURL=NuRoute.node.js.map