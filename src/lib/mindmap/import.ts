"use client";

// Importação de slides do Canva (e afins) para nós do mapa mental.
// O usuário exporta no Canva (Compartilhar -> Baixar) como PDF ou imagens e
// solta os arquivos aqui. PDF é renderizado página a página via pdf.js (100%
// no cliente, offline). Imagens entram direto. Tudo vira PNG/imagem + dimensões.

export type ImportedSlide = {
  blob: Blob;
  /** dimensões nativas em px (definem a proporção do nó). */
  w: number;
  h: number;
};

const PDF_MAX_WIDTH = 1600; // qualidade x tamanho do arquivo
const IMAGE_MIME = /^image\//;
const PDF_MIME = "application/pdf";

function isPdf(file: File): boolean {
  return file.type === PDF_MIME || /\.pdf$/i.test(file.name);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem."))),
      "image/png"
    );
  });
}

/** Renderiza cada página do PDF como um slide PNG. */
async function importPdf(file: File): Promise<ImportedSlide[]> {
  const pdfjs = await import("pdfjs-dist");
  // worker servido da raiz (copiado em public/); resolve em web/Tauri/Capacitor.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const out: ImportedSlide[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, PDF_MAX_WIDTH / base.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvas, viewport }).promise;
    const blob = await canvasToBlob(canvas);
    out.push({ blob, w: canvas.width, h: canvas.height });
    page.cleanup();
  }

  await pdf.destroy();
  return out;
}

/** Lê uma imagem solta, medindo as dimensões nativas. */
async function importImage(file: File): Promise<ImportedSlide> {
  const bitmap = await createImageBitmap(file);
  const slide: ImportedSlide = { blob: file, w: bitmap.width, h: bitmap.height };
  bitmap.close();
  return slide;
}

/**
 * Importa uma lista de arquivos (PDFs e/ou imagens) em ordem, expandindo cada
 * PDF nas suas páginas. Arquivos não suportados são ignorados.
 */
export async function importSlideFiles(files: File[]): Promise<ImportedSlide[]> {
  const slides: ImportedSlide[] = [];
  for (const file of files) {
    if (isPdf(file)) {
      slides.push(...(await importPdf(file)));
    } else if (IMAGE_MIME.test(file.type)) {
      slides.push(await importImage(file));
    }
  }
  return slides;
}
