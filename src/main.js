"use strict";
(async () => {
  try {
    const payloadUrls = [0, 1, 2, 3].map(
      index => `src/pass07/payload-${index}.txt?v=rebuild-pass07`
    );
    const responses = await Promise.all(payloadUrls.map(url => fetch(url)));
    for (const response of responses) {
      if (!response.ok) throw new Error(`Pass 07 payload load failed: ${response.status}`);
    }
    const encoded = (await Promise.all(responses.map(response => response.text())))
      .map(chunk => chunk.trim())
      .join("");
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const source = await new Response(stream).text();
    (0, eval)(source);
  } catch (error) {
    console.error("Coreless pass 07 boot failed", error);
    const buildStatus = document.getElementById("buildStatus");
    const auditStatus = document.getElementById("auditStatus");
    if (buildStatus) buildStatus.textContent = "실행 오류";
    if (auditStatus) auditStatus.textContent = "PASS 07 · 로드 실패";
    throw error;
  }
})();
