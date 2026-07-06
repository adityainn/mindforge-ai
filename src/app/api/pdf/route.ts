import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse the PDF using modern TypeScript PDFParse API
    const parser = new PDFParse({ data: arrayBuffer });
    const textResult = await parser.getText();

    // Clean up parser document resources
    await parser.destroy();

    return NextResponse.json({ text: textResult.text });
  } catch (error) {
    console.error("API PDF upload error:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF file. Ensure it is a valid text-based PDF." },
      { status: 500 }
    );
  }
}
