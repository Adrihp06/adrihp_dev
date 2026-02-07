import pypdf

reader = pypdf.PdfReader("adrian_cv_ai.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open("scripts/cv_text.txt", "w") as f:
    f.write(text)
