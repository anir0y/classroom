import re
import os
import sys

def calculate_seo_score(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split front matter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {"score": 0, "details": "No front matter found"}
    
    front_matter = parts[1]
    body = parts[2]

    # Extract Title
    title_match = re.search(r'^title:\s*"?(.*?)"?\s*$', front_matter, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else ""
    
    # Extract Description
    desc_match = re.search(r'^description:\s*"?(.*?)"?\s*$', front_matter, re.MULTILINE)
    description = desc_match.group(1).strip() if desc_match else ""

    score = 0
    max_score = 100
    details = []

    # 1. Title Length (20 pts)
    # Ideal: 50-60 chars
    title_len = len(title)
    if 40 <= title_len <= 70:
        score += 20
        details.append(f"[+] Title length is good: {title_len} chars (20/20)")
    elif title_len > 0:
        score += 10
        details.append(f"[!] Title length is sub-optimal: {title_len} chars (10/20)")
    else:
        details.append("[-] Title is missing (0/20)")

    # 2. Description Length (30 pts)
    # Ideal: 120-160 chars
    desc_len = len(description)
    if 120 <= desc_len <= 165:
        score += 30
        details.append(f"[+] Description length is good: {desc_len} chars (30/30)")
    elif 50 <= desc_len <= 119:
        score += 15
        details.append(f"[!] Description is a bit short: {desc_len} chars (15/30)")
    elif desc_len > 165:
        score += 15
        details.append(f"[!] Description is too long: {desc_len} chars (15/30)")
    else:
        details.append("[-] Description is missing or very short (0/30)")

    # 3. Keyword in Description (20 pts)
    # Check if important words from title are in description
    if title and description:
        important_words = [w.lower() for w in re.findall(r'\w+', title) if len(w) > 3]
        found_keywords = [w for w in important_words if w in description.lower()]
        if len(found_keywords) >= 2:
            score += 20
            details.append(f"[+] Keywords from title found in description: {', '.join(found_keywords)} (20/20)")
        elif len(found_keywords) == 1:
            score += 10
            details.append(f"[!] Only one keyword from title found in description (10/20)")
        else:
            details.append("[-] No keywords from title found in description (0/20)")

    # 4. Image Alt Text (15 pts)
    images = re.findall(r'!\[(.*?)\]\(.*?\)', body)
    if images:
        empty_alt = [img for img in images if not img.strip() or img.lower() == 'image' or img.lower() == 'logo']
        if not empty_alt:
            score += 15
            details.append(f"[+] All {len(images)} images have descriptive alt text (15/15)")
        elif len(empty_alt) < len(images):
            score += 7
            details.append(f"[!] Some images ({len(empty_alt)}/{len(images)}) are missing descriptive alt text (7/15)")
        else:
            details.append("[-] All images are missing descriptive alt text (0/15)")
    else:
        score += 15 # No images is fine too, but let's assume it's good if none
        details.append("[+] No images found, nothing to optimize (15/15)")

    # 5. Heading Structure (15 pts)
    headings = re.findall(r'^(#+)\s', body, re.MULTILINE)
    if headings:
        h1_count = headings.count('#')
        if h1_count > 1:
            details.append("[-] Multiple H1 tags found (H1 should be unique, usually the title) (0/15)")
        else:
            score += 15
            details.append(f"[+] Good heading structure with {len(headings)} headings (15/15)")
    else:
        details.append("[-] No headings found in body (0/15)")

    return {"score": score, "details": "\n".join(details)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 seo_score.py <path_to_markdown_file>")
        sys.exit(1)
    
    res = calculate_seo_score(sys.argv[1])
    print(f"SEO Score for {os.path.basename(sys.argv[1])}: {res['score']}/100")
    print(res['details'])
