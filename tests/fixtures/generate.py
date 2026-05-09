#!/usr/bin/env uv run --script
#
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "polars>=1.36.1",
#   "xlsxwriter>=3.2.0",
# ]
# ///
#
# PEP 723 - Inline script metadata
# https://peps.python.org/pep-0723/

from pathlib import Path

import polars as pl
from xlsxwriter import Workbook


ROOT = Path(__file__).parent


def rows():
    left = pl.DataFrame(
        {
            "id": ["1042", "1046", "1047", "1048", "", "1050"],
            "name": ["John Doe", "Bob Jones", "Charlie Brown", "Diana Prince", "", "Eve Adams"],
            "email": [
                "john@old.com",
                "bob@example.com",
                "charlie@example.com",
                "diana@example.com",
                "",
                "eve@example.com",
            ],
            "status": ["Active", "Inactive", "Pending", "Active", "", "Active"],
            "role": ["User", "User", "User", "Admin", "", "User"],
            "joined": ["2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05", "", "2024-01-06"],
            "score": ["1,200.50", "700.00", "88.75", "990.00", "", "42.00"],
        }
    )
    right = pl.DataFrame(
        {
            "id": ["1042", "1045", "1047", "1048", "", "1050"],
            "name": ["John Doe", "Alice Smith", "Charlie Brown", "Diana Prince", "", "Eve Adams"],
            "email": [
                "john@new.com",
                "alice@example.com",
                "charlie@example.com",
                "diana@example.com",
                "",
                "eve@example.com",
            ],
            "status": ["Active", "Pending", "Active", "Active", "", "Active"],
            "access": ["User", "Admin", "User", "Admin", "", "User"],
            "joined": ["2024-01-02", "2024-01-07", "2024-01-04", "2024-01-05", "", "2024-01-06"],
            "score": ["1,200.50", "810.25", "88.75", "990.00", "", "42.00"],
            "region": ["NA", "EU", "NA", "APAC", "", "NA"],
        }
    )
    return left, right


def write_csv(left, right):
    left.write_csv(ROOT / "left.csv")
    right.write_csv(ROOT / "right.csv")


def write_xlsx(left, right):
    for path, main, other in [
        (ROOT / "left.xlsx", left, right),
        (ROOT / "right.xlsx", right, left),
    ]:
        with Workbook(path) as workbook:
            main.write_excel(workbook=workbook, worksheet="Customers", autofilter=False)
            other.head(3).write_excel(workbook=workbook, worksheet="Archive", autofilter=False)


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    left, right = rows()
    write_csv(left, right)
    write_xlsx(left, right)


if __name__ == "__main__":
    main()
