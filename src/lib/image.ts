// Converte um arquivo de imagem em data URL redimensionada (lado máx. `max` px,
// JPEG 0.82). Usado pelo editor de texto e pela Lousa pra inserir imagens locais
// sem depender de prompt()/URL externa — funciona no site, no EXE (Tauri/WebView2)
// e no celular, e deixa a imagem embutida (sincroniza junto no JSON).
export async function fileToDownscaledDataUrl(
  file: File,
  max = 1100
): Promise<{ src: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    let { width, height } = img;
    if (width > max || height > max) {
      const r = Math.min(max / width, max / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    const src = canvas.toDataURL("image/jpeg", 0.82);
    return { src, w: width, h: height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
