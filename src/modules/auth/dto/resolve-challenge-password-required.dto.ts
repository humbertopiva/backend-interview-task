export interface ResolveChallengePasswordRequiredDto {
  username: string;
  password: string;
  secretHash: string;
  session: string;
}