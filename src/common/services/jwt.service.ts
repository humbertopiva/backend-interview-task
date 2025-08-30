import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import axios from "axios";

let pems: Record<string, string> = {};

export class JwtService {
  // Busca e cacheia os PEMs do Cognito
  static async getPems(userPoolId: string, region: string) {
    if (Object.keys(pems).length > 0) return pems;

    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const { data } = await axios.get(url);

    data.keys.forEach((key: any) => {
      pems[key.kid] = jwkToPem(key);
    });

    return pems;
  }

  // Extrai token de um header específico
  static extractToken(ctx: any, headerName = "authorization"): string | null {
    const raw = ctx.headers[headerName] as string | undefined;
    if (!raw) return null;
    return headerName === "authorization" ? raw.split(" ")[1] : raw;
  }

  // Decodifica header do JWT
  static decodeTokenHeader(token: string): any {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new Error("Invalid token");
    return decoded;
  }

  // Busca PEM pro token
  static async getPemForToken(decodedHeader: any, userPoolId: string, region: string): Promise<string> {
    const pems = await this.getPems(userPoolId, region);
    const pem = pems[decodedHeader.header.kid];
    if (!pem) throw new Error("Key not found");
    return pem;
  }

  // Verifica token
  static verifyToken(token: string, pem: string): any {
    return jwt.verify(token, pem);
  }

  // Mapeia claims do Access Token
  static mapAccessClaims(decoded: any) {
    return {
      sub: decoded.sub,
      username: decoded.username || decoded["cognito:username"],
    };
  }

  // Mapeia claims do ID Token
  static mapIdClaims(decoded: any) {
    return {
      email: decoded.email,
    };
  }

  // Decodifica e verifica token, retornando claims mapeadas
  static async decodeAndVerify(token: string, mapClaims: (decoded: any) => any) {
    const userPoolId = process.env.COGNITO_POOL_ID || "";
    const region = process.env.AWS_REGION || "us-east-1";

    const header = JwtService.decodeTokenHeader(token);
    const pem = await JwtService.getPemForToken(header, userPoolId, region);
    const decoded = JwtService.verifyToken(token, pem);
    
    return mapClaims(decoded);
  }
}
