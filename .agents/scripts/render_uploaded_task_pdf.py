from pathlib import Path

import pymupdf


pdf_path = Path(
    "attached_assets/Replit_Task_Instructions_—_AU,_NZ_&_US_State_Gaps_(1)_1788486253978.pdf"
)
output_dir = Path(".agents/outputs/task-instructions-pages")
output_dir.mkdir(parents=True, exist_ok=True)

document = pymupdf.open(pdf_path)
print(f"pages={document.page_count}")
for index, page in enumerate(document):
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
    output_path = output_dir / f"page-{index + 1}.png"
    pixmap.save(output_path)
    print(output_path)