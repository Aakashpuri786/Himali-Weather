export type ProvinceInfo = {
  code: string;
  name: string;
  capital: string;
  color: string;
  hover: string;
};

// Nepal's 7 provinces with official names + assigned distinctive colors
export const PROVINCES: Record<string, ProvinceInfo> = {
  "1": { code: "1", name: "Koshi",         capital: "Biratnagar",  color: "#e07a5f", hover: "#d8633f" },
  "2": { code: "2", name: "Madhesh",       capital: "Janakpur",    color: "#81b29a", hover: "#5e9c80" },
  "3": { code: "3", name: "Bagmati",       capital: "Hetauda",     color: "#f2cc8f", hover: "#e8b84f" },
  "4": { code: "4", name: "Gandaki",       capital: "Pokhara",     color: "#a78a7f", hover: "#8a6c61" },
  "5": { code: "5", name: "Lumbini",       capital: "Deukhuri",    color: "#6f9ab8", hover: "#4f81a3" },
  "6": { code: "6", name: "Karnali",       capital: "Birendranagar", color: "#c08497", hover: "#a8657c" },
  "7": { code: "7", name: "Sudurpashchim", capital: "Godawari",    color: "#8d8741", hover: "#706a30" },
};

export const provinceOf = (code: string) => PROVINCES[code] ?? PROVINCES["3"];
