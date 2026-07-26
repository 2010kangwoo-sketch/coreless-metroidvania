import Facebook from "@auth/express/providers/facebook";
import Google from "@auth/express/providers/google";
import Kakao from "@auth/express/providers/kakao";
import Naver from "@auth/express/providers/naver";

const DEFINITIONS = Object.freeze([
  ["google", "Google", Google, "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
  ["kakao", "카카오", Kakao, "AUTH_KAKAO_ID", "AUTH_KAKAO_SECRET"],
  ["facebook", "Facebook", Facebook, "AUTH_FACEBOOK_ID",
    "AUTH_FACEBOOK_SECRET"],
  ["naver", "네이버", Naver, "AUTH_NAVER_ID", "AUTH_NAVER_SECRET"],
].map(([id, label, factory, idKey, secretKey]) =>
  Object.freeze({ id, label, factory, idKey, secretKey })));

export function providerAvailability(env = process.env) {
  return Object.freeze(DEFINITIONS.map(item => Object.freeze({
    id: item.id,
    label: item.label,
    enabled: Boolean(env[item.idKey] && env[item.secretKey]),
  })));
}

export function configuredProviders(env = process.env) {
  return DEFINITIONS.flatMap(item => {
    const clientId = env[item.idKey];
    const clientSecret = env[item.secretKey];
    return clientId && clientSecret
      ? [item.factory({ clientId, clientSecret })]
      : [];
  });
}

export function callbackUrls(origin) {
  const base = String(origin ?? "").replace(/\/+$/, "");
  return Object.freeze(DEFINITIONS.map(item => Object.freeze({
    id: item.id,
    url: `${base}/auth/callback/${item.id}`,
  })));
}
