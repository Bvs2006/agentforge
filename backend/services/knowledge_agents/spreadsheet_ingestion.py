import os
from typing import List, Optional, Any
from datetime import datetime

from .security import validate_path, validate_file_type
from .models import KnowledgeSource, SourceType, Chunk


class SpreadsheetIngestion:
    def __init__(self):
        self._pandas_available = False
        self._openpyxl_available = False
        try:
            import pandas as pd
            self._pandas_available = True
        except ImportError:
            pass
        try:
            import openpyxl
            self._openpyxl_available = True
        except ImportError:
            pass

    def ingest(self, file_path: str, source: Optional[KnowledgeSource] = None) -> dict:
        abs_path = validate_path(file_path)
        ext = os.path.splitext(abs_path)[1].lower()

        if ext == ".csv":
            result = self._ingest_csv(abs_path)
        elif ext in (".xlsx", ".xls"):
            result = self._ingest_excel(abs_path)
        else:
            raise ValueError(f"Unsupported spreadsheet format: {ext}")

        result["metadata"]["source_type"] = SourceType.SPREADSHEET.value
        result["source_type"] = SourceType.SPREADSHEET

        if source:
            source.metadata.update(result["metadata"])

        return result

    def _ingest_csv(self, path: str) -> dict:
        text_parts = []
        metadata = {"filename": os.path.basename(path), "file_size": os.path.getsize(path)}
        if self._pandas_available:
            import pandas as pd
            try:
                df = pd.read_csv(path)
                metadata["rows"] = len(df)
                metadata["columns"] = list(df.columns)
                metadata["shape"] = df.shape
                text_parts.append(f"CSV File: {os.path.basename(path)}")
                text_parts.append(f"Rows: {len(df)}, Columns: {len(df.columns)}")
                text_parts.append(f"Columns: {', '.join(str(c) for c in df.columns)}")
                text_parts.append("")
                for _, row in df.iterrows():
                    row_text = " | ".join(f"{col}: {val}" for col, val in row.items())
                    text_parts.append(row_text)
            except Exception as e:
                text_parts.append(f"[CSV parsing error: {e}]")
        else:
            try:
                with open(path, "r", encoding="utf-8", errors="replace") as f:
                    text_parts.append(f.read())
            except Exception as e:
                text_parts.append(f"[CSV read error: {e}]")

        return "\n".join(text_parts), metadata

    def _ingest_excel(self, path: str) -> dict:
        text_parts = []
        metadata = {"filename": os.path.basename(path), "file_size": os.path.getsize(path)}
        if self._pandas_available:
            import pandas as pd
            try:
                excel_file = pd.ExcelFile(path)
                sheet_names = excel_file.sheet_names
                metadata["sheets"] = sheet_names
                metadata["sheet_count"] = len(sheet_names)
                text_parts.append(f"Excel File: {os.path.basename(path)}")
                text_parts.append(f"Sheets: {', '.join(sheet_names)}")
                text_parts.append("")
                for sheet in sheet_names:
                    df = pd.read_excel(path, sheet_name=sheet)
                    metadata[f"sheet_{sheet}_shape"] = df.shape
                    text_parts.append(f"--- Sheet: {sheet} ({df.shape[0]} rows, {df.shape[1]} cols) ---")
                    text_parts.append(f"Columns: {', '.join(str(c) for c in df.columns)}")
                    for _, row in df.iterrows():
                        row_text = " | ".join(f"{col}: {val}" for col, val in row.items() if pd.notna(val))
                        if row_text.strip():
                            text_parts.append(row_text)
                    text_parts.append("")
            except Exception as e:
                text_parts.append(f"[Excel parsing error: {e}]")
        else:
            text_parts.append(f"[Excel parsing requires pandas/openpyxl]")

        return "\n".join(text_parts), metadata

    def get_supported_extensions(self) -> List[str]:
        return [".csv", ".xlsx", ".xls"]
