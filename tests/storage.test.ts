import { describe, expect, it } from "vitest";
import { sniff, isInlinePreviewable } from "@/server/storage";

describe("storage sniff", () => {
  it("detects PDF files by magic bytes", () => {
    const pdfBuf = Buffer.from("%PDF-1.7 sample data");
    const result = sniff(pdfBuf);
    expect(result).not.toBeNull();
    expect(result?.mime).toBe("application/pdf");
    expect(result?.ext).toBe("pdf");
    expect(isInlinePreviewable(result?.mime)).toBe(true);
  });

  it("detects AutoCAD DWG files by AC10 version header", () => {
    // AC1032 = AutoCAD 2018/2021/2024
    const dwgBuf = Buffer.from("AC1032\x00\x00some binary dwg data");
    const result = sniff(dwgBuf, "plan.dwg");
    expect(result).not.toBeNull();
    expect(result?.mime).toBe("image/vnd.dwg");
    expect(result?.ext).toBe("dwg");
    expect(isInlinePreviewable(result?.mime)).toBe(false);
  });

  it("detects AutoCAD DXF files (ASCII and Binary)", () => {
    const binaryDxf = Buffer.from("AutoCAD Binary DXF\r\n\x1a\x00data");
    const res1 = sniff(binaryDxf, "drawing.dxf");
    expect(res1?.ext).toBe("dxf");
    expect(res1?.mime).toBe("image/vnd.dxf");
    expect(isInlinePreviewable(res1?.mime)).toBe(false);

    const asciiDxf = Buffer.from("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF");
    const res2 = sniff(asciiDxf, "drawing.dxf");
    expect(res2?.ext).toBe("dxf");
    expect(res2?.mime).toBe("image/vnd.dxf");
  });

  it("detects Word DOCX files (ZIP container with docx extension or word/ dir)", () => {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const docxBuf = Buffer.concat([zipHeader, Buffer.from("word/document.xml")]);

    const resWithExt = sniff(zipHeader, "syllabus.docx");
    expect(resWithExt?.ext).toBe("docx");
    expect(resWithExt?.mime).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(isInlinePreviewable(resWithExt?.mime)).toBe(false);

    const resFromContent = sniff(docxBuf);
    expect(resFromContent?.ext).toBe("docx");
  });

  it("detects PowerPoint PPTX files", () => {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const pptxBuf = Buffer.concat([zipHeader, Buffer.from("ppt/presentation.xml")]);

    const resWithExt = sniff(zipHeader, "lecture1.pptx");
    expect(resWithExt?.ext).toBe("pptx");
    expect(resWithExt?.mime).toBe("application/vnd.openxmlformats-officedocument.presentationml.presentation");
    expect(isInlinePreviewable(resWithExt?.mime)).toBe(false);

    const resFromContent = sniff(pptxBuf);
    expect(resFromContent?.ext).toBe("pptx");
  });

  it("detects Excel XLSX files", () => {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const xlsxBuf = Buffer.concat([zipHeader, Buffer.from("xl/workbook.xml")]);

    const resWithExt = sniff(zipHeader, "grades.xlsx");
    expect(resWithExt?.ext).toBe("xlsx");
    expect(resWithExt?.mime).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(isInlinePreviewable(resWithExt?.mime)).toBe(false);

    const resFromContent = sniff(xlsxBuf);
    expect(resFromContent?.ext).toBe("xlsx");
  });

  it("detects legacy Office files (.doc, .ppt, .xls)", () => {
    const cfbHeader = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

    const pptRes = sniff(cfbHeader, "slides.ppt");
    expect(pptRes?.ext).toBe("ppt");
    expect(pptRes?.mime).toBe("application/vnd.ms-powerpoint");

    const docRes = sniff(cfbHeader, "notes.doc");
    expect(docRes?.ext).toBe("doc");
    expect(docRes?.mime).toBe("application/msword");

    const xlsRes = sniff(cfbHeader, "sheet.xls");
    expect(xlsRes?.ext).toBe("xls");
    expect(xlsRes?.mime).toBe("application/vnd.ms-excel");
  });

  it("rejects unsupported executable or random binary files", () => {
    const exeBuf = Buffer.from("MZ\x90\x00\x03\x00\x00\x00"); // DOS/PE executable
    expect(sniff(exeBuf)).toBeNull();

    const randomBuf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc]);
    expect(sniff(randomBuf)).toBeNull();
  });
});
