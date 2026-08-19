import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors

pdf_filename = "skin-cancer-screening-final-recommendation.pdf"
doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=letter,
    rightMargin=54,
    leftMargin=54,
    topMargin=54,
    bottomMargin=54,
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "DocTitle",
    parent=styles["Heading1"],
    fontSize=16,
    leading=20,
    textColor=colors.HexColor("#1e293b"),
    spaceAfter=10,
)
h1_style = ParagraphStyle(
    "SectionHeading",
    parent=styles["Heading2"],
    fontSize=12,
    leading=15,
    textColor=colors.HexColor("#0f766e"),
    spaceBefore=12,
    spaceAfter=6,
)
body_style = ParagraphStyle(
    "BodyText",
    parent=styles["Normal"],
    fontSize=9.5,
    leading=13.5,
    textColor=colors.HexColor("#334155"),
    spaceAfter=6,
)

story = []

# Page 1: Abstract & Recommendation Summary
story.append(Paragraph("US Preventive Services Task Force Recommendation Statement (2023)", body_style))
story.append(Paragraph("Screening for Skin Cancer in Adolescents and Adults: US Preventive Services Task Force Recommendation Statement", title_style))
story.append(Paragraph("<b>Source:</b> U.S. Preventive Services Task Force (USPSTF 2023) | JAMA Clinical Guidelines Publication", body_style))
story.append(Spacer(1, 10))

story.append(Paragraph("Abstract & Screening Recommendation Summary", h1_style))
story.append(Paragraph(
    "<b>Importance:</b> Skin cancer is the most commonly diagnosed malignancy in the United States. Although melanoma accounts for approximately 1% of all skin cancers, it is responsible for over 80% of all skin cancer deaths. Basal cell carcinoma (BCC) and squamous cell carcinoma (SCC) constitute nonmelanoma skin cancer (NMSC); they rarely metastasize but contribute significantly to health care morbidity and cosmetic impairment.",
    body_style
))
story.append(Paragraph(
    "<b>Target Population:</b> This recommendation applies to asymptomatic adolescents and adults aged 15 years or older without a personal history of premalignant or malignant skin lesions and who are not under active dermatologic surveillance for suspicious skin spots.",
    body_style
))
story.append(Paragraph(
    "<b>Primary Recommendation:</b> The USPSTF concludes that the current evidence is <b>insufficient</b> to assess the balance of benefits and harms of visual skin examination by a clinician to screen for skin cancer in asymptomatic adolescents and adults. <b>(Grade: I statement)</b>",
    body_style
))
story.append(Paragraph(
    "<b>Distinction from Behavioral Counseling:</b> Primary care clinicians should distinguish skin cancer screening (visual clinician examination of asymptomatic individuals) from behavioral counseling. Behavioral counseling to minimize ultraviolet (UV) exposure remains strongly recommended for fair-skinned individuals aged 6 months to 24 years (Grade B).",
    body_style
))
story.append(PageBreak())

# Page 2: Clinical Considerations & Risk Factors
story.append(Paragraph("Clinical Considerations & Patient Risk Assessment", h1_style))
story.append(Paragraph(
    "<b>Assessment of Risk:</b> Primary risk factors for skin cancer include fair skin phototypes (Fitzpatrick skin types I and II), red or blond hair, light eye color, tendency to sunburn rather than tan, freckles, extensive lifetime UV exposure, history of severe or blistering sunburns during childhood/adolescence, indoor tanning use, and immunosuppression (such as solid organ transplant recipients).",
    body_style
))
story.append(Paragraph(
    "<b>Nevus Density and Dysplastic Nevi:</b> Having a high total count of benign melanocytic nevi (>50 to 100 nevi) or the presence of atypical (dysplastic) nevi confers a substantially elevated relative risk of cutaneous malignant melanoma.",
    body_style
))
story.append(Paragraph(
    "<b>Genetic and Familial Factors:</b> A family history of melanoma in a first-degree relative or known hereditary melanoma syndromes (e.g., mutations in CDKN2A or CDK4) significantly increases melanoma susceptibility.",
    body_style
))
story.append(Paragraph(
    "<b>Screening Tests Evaluated:</b> Visual skin examination involves inspection of the entire integumentary surface (Total Body Skin Examination or TBSE) by a primary care physician, dermatologist, or trained nurse practitioner. Adjunctive diagnostic modalities evaluated include dermoscopy (epiluminescence microscopy) and automated digital photographic surveillance.",
    body_style
))
story.append(PageBreak())

# Page 3: Rationale - Benefits and Harms of Screening
story.append(Paragraph("Rationale: Evidence on Benefits and Harms of Screening", h1_style))
story.append(Paragraph(
    "<b>Detection of Early-Stage Lesions:</b> While clinical visual examination can detect skin cancers at earlier stages (such as melanoma in situ or thin invasive melanoma <1 mm Breslow thickness), evidence is lacking regarding whether routine screening reduces all-cause mortality, melanoma-specific mortality, or disease morbidity in asymptomatic general populations.",
    body_style
))
story.append(Paragraph(
    "<b>Overdiagnosis and Overtreatment:</b> A major concern identified by the USPSTF is overdiagnosis—the histologic identification and surgical excision of indolent, slow-growing, or biologically non-aggressive melanocytic or keratinocyte lesions that would never have caused clinical harm or symptoms during the patient's lifetime.",
    body_style
))
story.append(Paragraph(
    "<b>Potential Harms of Screening:</b> Direct harms of visual screening include cosmetic scarring from diagnostic skin biopsies, wound infection, bleeding, unnecessary specialty referrals, financial burden, and psychological anxiety stemming from false-positive evaluations.",
    body_style
))
story.append(Paragraph(
    "<b>Diagnostic Accuracy:</b> Across primary care settings, clinician visual skin inspection demonstrates variable sensitivity (40% to 90%) and specificity (70% to 95%) for melanoma detection, with lower diagnostic accuracy observed among non-dermatologist primary care clinicians compared to specialized dermatologists.",
    body_style
))
story.append(PageBreak())

# Page 4: Patient Evaluation & Suspicious Lesions
story.append(Paragraph("Evaluation of Suspicious Lesions & Clinical Practice", h1_style))
story.append(Paragraph(
    "<b>The ABCDE Criteria for Melanoma:</b> Clinicians and patients should remain vigilant for clinical signs of suspicious pigmented lesions using the validated ABCDE checklist:",
    body_style
))
story.append(Paragraph(
    "• <b>A (Asymmetry):</b> One half of the lesion does not match the other half in contour or architecture.<br/>"
    "• <b>B (Border):</b> Edges are irregular, scalloped, ragged, or poorly circumscribed.<br/>"
    "• <b>C (Color variation):</b> Non-uniform pigmentation with shades of tan, brown, black, white, red, or blue.<br/>"
    "• <b>D (Diameter):</b> Lesions greater than 6 mm (pencil eraser size), although melanomas can present smaller.<br/>"
    "• <b>E (Evolving):</b> Any lesion that changes in size, shape, color, elevation, or causes new pruritus/bleeding.",
    body_style
))
story.append(Paragraph(
    "<b>The Ugly Duckling Sign:</b> Lesions that appear morphologically distinct or outlier compared to a patient's surrounding baseline nevi warrant dedicated diagnostic assessment and prompt histologic biopsy.",
    body_style
))
story.append(Paragraph(
    "<b>Symptomatic vs Asymptomatic Presentation:</b> The USPSTF Grade I statement applies solely to asymptomatic universal screening. Any patient presenting with an actively changing, symptomatic, ulcerating, bleeding, or clinically suspicious skin lesion must undergo immediate targeted diagnostic biopsy and histological evaluation.",
    body_style
))
story.append(PageBreak())

# Page 5: Implementation and Research Gaps
story.append(Paragraph("Implementation Considerations & Future Research Gaps", h1_style))
story.append(Paragraph(
    "<b>Research Needs:</b> Randomized clinical trials or high-quality prospective cohort studies are urgently needed to assess whether routine clinician visual skin screening or digital dermoscopic imaging reduces melanoma mortality.",
    body_style
))
story.append(Paragraph(
    "<b>Risk Stratification Algorithms:</b> Validated multivariable risk-prediction models are required to identify enriched sub-populations of exceptionally high-risk patients who might derive a favorable net benefit from structured surveillance.",
    body_style
))
story.append(Paragraph(
    "<b>Artificial Intelligence and Digital Dermoscopy:</b> Computer-assisted diagnostic algorithms and mobile teledermatology applications require standardized clinical validation before integration into routine primary care screening workflows.",
    body_style
))
story.append(Paragraph(
    "<b>Summary for Clinicians:</b> Clinicians should remain alert for suspicious skin lesions during routine physical examinations, counsel patients with fair skin phototypes on sun protection behaviors, and exercise clinical judgment when assessing individual patient risk factors and preferences.",
    body_style
))

doc.build(story)
print(f"Generated comprehensive {pdf_filename}")
