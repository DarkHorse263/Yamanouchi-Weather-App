from pathlib import Path

import fitz


source = Path("attached_assets/Replit_Task_Instructions_—_AU,_NZ_&_US_State_Gaps_1787960442183.pdf")
output_dir = Path(".agents/outputs/au-nz-us-state-gaps")
output_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
print(f"pages={document.page_count}")
for index, page in enumerate(document):
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
    destination = output_dir / f"page-{index + 1}.png"
    pixmap.save(destination)
    print(destination)