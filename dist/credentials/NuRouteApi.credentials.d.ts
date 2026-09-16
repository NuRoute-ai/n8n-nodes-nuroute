import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class NuRouteApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: {
        readonly light: "file:nuroute.svg";
        readonly dark: "file:nuroute.svg";
    };
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
//# sourceMappingURL=NuRouteApi.credentials.d.ts.map