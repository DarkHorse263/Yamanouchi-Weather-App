import re

with open("scripts/build-side-copy-cuts.py", "r") as f:
    content = f.read()

new_markets = """
MARKETS = [  # (key, master, side, lines)
    ("au", "feelzlike-anthem-au-silent.mp4", "left", [
        "live snow · weather · roads",
        "australia · nz · japan · canada · usa",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("us", "feelzlike-anthem-us-silent.mp4", "right", [
        "live snow · weather · roads",
        "usa · canada · japan · australia · nz",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("jp", "feelzlike-anthem-jp-silent.mp4", "left", [
        "積雪・天気・道路をライブで",
        "日本・豪州・NZ・カナダ・米国",
        "パウダーアラートをメールで",
        "旅の計画も",
        "feelzlike.com"
    ]),
    ("jp-english", "feelzlike-anthem-jp-english-silent.mp4", "right", [
        "live snow · weather · roads",
        "japan · australia · nz · canada · usa",
        "powder alerts to your inbox",
        "plan your travel",
        "feelzlike.com"
    ]),
    ("au-japan-winter", "feelzlike-anthem-au-japan-winter-silent.mp4", "right", [
        "planning a japan winter?",
        "check the destinations we cover",
        "mountain weather · routes · transport",
        "powder alerts before you fly",
        "feelzlike.com"
    ]),
]
"""

content = re.sub(r'MARKETS = \[.*?\]\n', new_markets.strip() + '\n', content, flags=re.DOTALL)
content = re.sub(r'EN = \[.*?\]\nJA = \[.*?\]\n', '', content, flags=re.DOTALL)

with open("scripts/build-side-copy-cuts.py", "w") as f:
    f.write(content)

print("Patched lists.")
