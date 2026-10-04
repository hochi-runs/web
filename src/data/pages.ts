/** The original page copy, also used to prepare the WordPress import. */
export function getLocalPageParagraphs() {
  return {
    about: {
      paragraphs: [
        "Hochi Runs is an independent record label, collective, and agency. We put out music, make videos, and put on shows.",
        "This is placeholder copy — replace it with the real story of the label whenever you're ready. The structure is here; just swap the words.",
      ],
    },
    legal: {
      paragraphs: [
        `© ${new Date().getFullYear()} Hochi Runs. All rights reserved. This media is under exclusive right to its creators.`,
        "Placeholder legal copy — replace with the label's real terms, privacy policy, and licensing information when ready.",
      ],
    },
  };
}
