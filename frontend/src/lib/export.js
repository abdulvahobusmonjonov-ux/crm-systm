function csvCell(value) {
    if (value === null || value === undefined)
        return "";
    const str = String(value);
    return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
export function exportToCsv(filename, rows) {
    if (!rows.length)
        return;
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.map(csvCell).join(","),
        ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(",")),
    ];
    const BOM = "﻿";
    const blob = new Blob([BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
