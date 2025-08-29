export class CognitoPayloadDto {
  sub!: string;
  email?: string;
  'cognito:groups'?: string[];
  [key: string]: any;
}