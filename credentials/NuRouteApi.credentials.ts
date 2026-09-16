import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class NuRouteApi implements ICredentialType {
  name = 'nuRouteApi';
  displayName = 'NuRoute API';
  documentationUrl = 'https://nuroute.ai/docs';

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://nuroute.ai',
      description: 'The base URL of your NuRoute gateway, no trailing slash',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'A NuRoute API key (starts with aicp-). Create one from your project\'s API Keys page.',
      required: true,
    },
  ];

  // Every request made with these credentials automatically gets this header —
  // node code never needs to read the API key itself.
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  // Used by n8n's "Test" button on the credentials form.
  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/v1/models',
      method: 'GET',
    },
  };
}
