import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
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
    fontSize=18,
    leading=22,
    textColor=colors.HexColor("#1e293b"),
    spaceAfter=12,
)
h1_style = ParagraphStyle(
    "SectionHeading",
    parent=styles["Heading2"],
    fontSize=13,
    leading=16,
    textColor=colors.HexColor("#0f766e"),
    spaceBefore=14,
    spaceAfter=8,
)
body_style = ParagraphStyle(
    "BodyText",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#334155"),
    spaceAfter=8,
)

story = []

# Title
story.append(Paragraph("US Preventive Services Task Force Recommendation Statement", body_style))
story.append(Paragraph("Screening for Skin Cancer in Adolescents and Adults: US Preventive Services Task Force Recommendation Statement", title_style))
story.append(Paragraph("<b>Source:</b> U.S. Preventive Services Task Force (USPSTF 2023) | JAMA Clinical Recommendation", body_style))
story.append(Spacer(1, 14))

# Page 1: Abstract & Recommendation Summary
story.append(Paragraph("Abstract & Recommendation Summary", h1_style))
story.append(Paragraph(
    "<b>Importance:</b> Skin cancer is the most commonly diagnosed cancer in the United States. Although melanoma accounts for only about 1% of all skin cancers, it is responsible for the vast majority of skin cancer deaths. Basal cell carcinoma and squamous cell carcinoma are the most common nonmelanoma skin cancers, which are rarely fatal but can cause substantial morbidity.",
    body_style
))
story.append(Paragraph(
    "<b>Objective:</b> To update the 2016 US Preventive Services Task Force (USPSTF) recommendation on screening for skin cancer in asymptomatic adolescents and adults.",
    body_style
))
story.append(Paragraph(
    "<b>Population:</b> This recommendation applies to asymptomatic adolescents and adults aged 15 years or older who do not have a personal history of premalignant or malignant skin lesions and are not under active surveillance or reporting suspicious skin spots.",
    body_style
))
story.append(Paragraph(
    "<b>Recommendation:</b> The USPSTF concludes that the current evidence is <b>insufficient</b> to assess the balance of benefits and harms of visual skin examination by a clinician to screen for skin cancer in asymptomatic adolescents and adults. <b>(Grade: I statement)</b>",
    body_style
))
story.append(PageBreak())

# Page 2: Summary of Recommendations and Evidence
story.append(Paragraph("Summary of Recommendations and Evidence", h1_style))
story.append(Paragraph(
    "<b>Assessment of Magnitude of Net Benefit:</b> The USPSTF found inadequate evidence that visual skin examination by a clinician to screen for skin cancer in asymptomatic adolescents and adults reduces morbidity or mortality from melanoma or keratinocyte carcinoma.",
    body_style
))
story.append(Paragraph(
    "<b>Evidence on Screening Accuracy:</b> Visual examination by dermatologists and primary care clinicians has variable sensitivity and specificity for detecting melanoma and nonmelanoma skin cancers. While dermoscopy and digital monitoring technologies can improve diagnostic accuracy in specialized dermatology settings, evidence regarding their routine application during primary care screening remains limited.",
    body_style
))
story.append(Paragraph(
    "<b>Balance of Benefits and Harms:</b> The USPSTF determined that the overall net benefit of clinical visual skin screening cannot be determined due to the lack of direct trial evidence linking universal routine screening to reduced all-cause or disease-specific mortality.",
    body_style
))
story.append(PageBreak())

# Page 3: Rationale - Assessment of Benefits and Harms
story.append(Paragraph("Rationale - Benefits and Harms of Screening", h1_style))
story.append(Paragraph(
    "<b>Potential Benefits:</b> Early detection of thin melanomas (Breslow thickness <1 mm) is associated with 5-year survival rates exceeding 95%. However, population-level screening studies (such as the German SCREEN project) have yielded conflicting long-term evidence regarding sustained reductions in melanoma mortality.",
    body_style
))
story.append(Paragraph(
    "<b>Potential Harms of Screening:</b> The primary harms of visual skin screening include diagnostic skin biopsies of benign lesions, procedure-related scarring, pain, infection, localized bleeding, patient anxiety, and overdiagnosis of indolent, nonlethal lesions that would never have caused clinical harm during the patient's lifetime.",
    body_style
))
story.append(Paragraph(
    "<b>Biopsy Burden:</b> Studies estimate that for every confirmed melanoma identified through population visual screening, between 20 and 50 benign lesions are surgically biopsied or excised.",
    body_style
))
story.append(PageBreak())

# Page 4: Clinical Considerations - Risk Assessment & High-Risk Groups
story.append(Paragraph("Clinical Considerations - Risk Assessment", h1_style))
story.append(Paragraph(
    "<b>Risk Factors:</b> Although routine screening is not recommended for asymptomatic average-risk populations, clinicians should remain alert to suspicious lesions during physical exams. Established risk factors for melanoma include fair skin types (Fitzpatrick types I and II), red or blond hair, blue or green eyes, freckling, older age, male sex, excessive ultraviolet (UV) radiation exposure, severe blistering sunburns, family history of melanoma in a first-degree relative, and presence of atypical or large numbers of melanocytic nevi (>50 moles).",
    body_style
))
story.append(Paragraph(
    "<b>ABCDE Criteria:</b> Clinicians and patients should evaluate suspicious pigmented lesions using the ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter greater than 6 mm, and Evolution (changes in size, shape, or shade over time).",
    body_style
))
story.append(Paragraph(
    "<b>Patient-Reported Lesions:</b> The 'I' statement does NOT apply to patients who present to their doctor reporting a concerning, changing, itchy, or bleeding mole. Such patients require prompt targeted clinical and dermatological evaluation.",
    body_style
))
story.append(PageBreak())

# Page 5: Implementation, Patient Counseling & Research Needs
story.append(Paragraph("Implementation and Research Needs", h1_style))
story.append(Paragraph(
    "<b>Primary Care Practice Guidance:</b> In the absence of definitive screening evidence, primary care physicians should exercise clinical judgment when deciding whether to perform full-body skin examinations, particularly in older white men and patients with significant sun-damage history.",
    body_style
))
story.append(Paragraph(
    "<b>Relationship to Behavioral Counseling:</b> Clinicians should continue to follow the separate USPSTF 2018 recommendation on behavioral counseling, which advises counseling fair-skinned youth aged 6 months to 24 years on sun-protective habits and UV avoidance (Grade B recommendation).",
    body_style
))
story.append(Paragraph(
    "<b>Research Needs:</b> High-priority research needs include well-designed randomized clinical trials evaluating visual screening's effect on melanoma-specific mortality, validated risk-stratification models to identify high-risk subgroups who benefit from targeted screening, and prospective studies measuring the rate and consequences of skin cancer overdiagnosis.",
    body_style
))

doc.build(story)
print(f"Generated {pdf_filename} successfully!")
