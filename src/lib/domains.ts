export interface DomainOption {
  value: string;
  label: string;
}

export const VIDEO_DOMAINS: DomainOption[] = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "politics_and_government", label: "Politics and Government" },
  { value: "news_and_current_affairs", label: "News and Current Affairs" },
  { value: "science", label: "Science" },
  { value: "technology_and_computing", label: "Technology and Computing" },
  { value: "business_and_finance", label: "Business and Finance" },
  { value: "entertainment", label: "Entertainment" },
  { value: "food_and_drink", label: "Food and Drink" },
  { value: "law_and_justice", label: "Law and Justice" },
  {
    value: "environment_and_sustainability",
    label: "Environment and Sustainability",
  },
  { value: "religion", label: "Religion" },
  { value: "media_marketing", label: "Media Marketing" },
  { value: "history_and_cultural", label: "History and Cultural" },
  { value: "work_and_careers", label: "Work and Careers" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
  { value: "others", label: "Others" },
];
