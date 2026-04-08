export const ACADEMIC_LEVELS = [
  { value: 'high_school', label: 'High School (9th–12th grade)' },
  { value: 'undergraduate', label: 'College/Undergraduate' },
  { value: 'postgraduate', label: "Postgraduate/Master's" },
  { value: 'professional', label: 'Working Professional' },
];

export const GRADE_LEVELS: Record<string, string[]> = {
  high_school: ['Grade 8','Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  undergraduate: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
  postgraduate: ['Year 1', 'Year 2'],
  professional: ['1-3 years', '3-5 years', '5+ years'],
};
