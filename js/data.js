/* =========================================================
   content.js — the single source of truth for every word
   on the site. Update résumé content here, never in the UI.
   ========================================================= */

window.RESUME_DATA = {

  name: "DeVon Rasch",
  suffix: "M.S.",
  displayName: "DeVon Rasch, M.S.",
  title: "Data & AI Engineer",
  tagline: "Machine Learning Systems · Data Platforms · LLM Applications",
  location: "Hutto, TX",
  email: "devonrasch@gmail.com",
  linkedin: "https://www.linkedin.com/in/devonrasch/",
  github: "https://github.com/zudevon",

  summary:
    "Data & AI engineer with 10 years of experience across gaming, consumer tech, telecom, and pharma. " +
    "Scaled production anomaly detection to 300+ pipelines at Apple, delivered $7M in storage savings at SciPlay, " +
    "and now build agentic-AI and LLM systems for consulting clients.",

  highlights: [
    "Scaled a Kubernetes anomaly-detection platform from 5 to 300+ pipelines (1,500+ metrics), cutting processing time from 15 to 3 minutes.",
    "Drove $7M in cumulative storage savings at SciPlay by automating S3-to-Glacier tiering (~$20K per pipeline per month).",
    "Generated $250K+ in savings within six weeks by automating SAP discount verification at Merck."
  ],

  skills: [
    {
      group: "LLM & AI",
      items: "hybrid RAG, agentic workflows & deployment, MCP tool servers, vector databases, fine-tuning (LoRA/QLoRA), prompt engineering, LLM evaluation & guardrails, TensorFlow, PyTorch"
    },
    {
      group: "Data Engineering",
      items: "Python (PySpark, pandas), SQL, Spark, Snowflake, Airflow, Delta Lake, ETL/ELT, streaming data, JavaScript/TypeScript, React, Node.js"
    },
    {
      group: "Platforms & MLOps",
      items: "Databricks, MLflow, AWS (S3, Glue, Athena, Kinesis, Lambda, SageMaker), Kubernetes, Docker, Terraform, Jenkins, CI/CD"
    }
  ],

  experience: [
    {
      role: "Independent Consultant — Data & AI Engineering",
      org: "Freelance",
      meta: "Remote",
      dates: "June 2025 – Present",
      bullets: [
        "Deliver agentic AI and data engineering solutions for commercial clients: multi-step agent workflows, MCP tool servers, and retrieval pipelines over private company data.",
        "Architecting a “Company Brain” knowledge system that pipelines meeting transcripts and Notion/Google Docs content into a Supabase vector database for natural-language retrieval.",
        "Fine-tune and self-host open-weight LLMs (LoRA/QLoRA) for clients whose data-governance rules prohibit external model APIs."
      ]
    },
    {
      role: "Data Engineer II / AI Engineer",
      org: "SciPlay (a Light & Wonder studio)",
      meta: "Austin, TX",
      dates: "2023 – 2025",
      bullets: [
        "Built and onboarded 15+ beta/dev/prod streaming and batch pipelines in Databricks, applying bronze/silver/gold medallion tiering across terabytes of daily gaming telemetry.",
        "Piloted MVP MLOps tooling in MLflow, experiment-tracking fitted models and wiring them into downstream data pipelines.",
        "Architected LLM-powered agents and RAG systems — including a vector-database incident-triage interface integrating Jira and campaign data — through stakeholder training and production adoption.",
        "Automated S3-to-Glacier storage tiering on streaming pipelines, delivering $7M in cumulative savings (~$20K per pipeline per month).",
        "Built Jenkins/Terraform CI/CD with automated change summarization (infrastructure review: ~1 week → single approval) and maintained 20–30 Airflow DAGs in Astronomer."
      ]
    },
    {
      role: "Machine Learning Engineer",
      org: "Apple (contract)",
      meta: "Remote",
      dates: "2022 – 2024",
      bullets: [
        "Scaled a real-time anomaly-detection platform from 5 to 300+ pipelines (1,500+ metrics), cutting processing time from 15 to 3 minutes.",
        "Productionized ensemble unsupervised models on Kubernetes with configuration-driven pods, raising onboarding capacity to 40+ pipelines per week.",
        "Built a self-service onboarding interface with automated config generation and resource right-sizing, eliminating 20–30 hours of manual onboarding weekly."
      ]
    },
    {
      role: "Full Stack Engineer",
      org: "AT&T (contract)",
      meta: "Remote",
      dates: "2021 – 2022",
      bullets: [
        "Led development of Northstar, a full-stack data-consolidation application unifying disparate telecom sources into a governed system of record.",
        "Built Python ingestion pipelines and React interfaces for network-topology visualization and data labeling."
      ]
    },
    {
      role: "Data Engineer",
      org: "Saatva",
      meta: "Remote",
      dates: "2021 – 2022",
      bullets: [
        "Engineered PySpark ETL pipelines integrating Facebook, Twitter, and Snapchat ad data into AWS Athena with hourly refresh via AWS Glue."
      ]
    },
    {
      role: "Data Scientist",
      org: "Degree Analytics (now CampusIQ)",
      meta: "Austin, TX",
      dates: "2019 – 2020",
      bullets: [
        "Built IoT pipelines and forecasting datasets modeling campus facility utilization, informing classroom consolidation and cohort scheduling.",
        "Delivered AWS ETL processes and QuickSight dashboards for cohort analysis and observability."
      ]
    },
    {
      role: "Associate Technologist (RPA → Innovation Team)",
      org: "Merck",
      meta: "Remote",
      dates: "2018 – 2019",
      bullets: [
        "Automated SAP discount verification, generating $250K+ in savings within six weeks.",
        "Rebuilt an OCR pipeline that replaced a five-FTE manual process with 1–2 hour turnaround; shipped a company-wide Rasa onboarding chatbot integrated with SharePoint."
      ]
    }
  ],

  education: [
    {
      degree: "M.S. in Data Science",
      school: "Eastern University",
      location: "St. Davids, PA",
      year: "2024"
    },
    {
      degree: "B.S. in Mathematics",
      school: "Huston-Tillotson University",
      location: "Austin, TX",
      year: "2019"
    }
  ],

  certifications: [
    "Databricks Certified Data Engineer Associate — Credential ID 70165650",
    "Post-Graduate Program in Data Science, Texas McCombs School of Business",
    "Level 3 International RPA Developer, UiPath",
    "Andrew Ng's Stanford Machine Learning Course — Coursera"
  ],

  awards: [
    "1st Place — Huston-Tillotson University Emerging Tech Competition, 2017",
    "2nd Place — Huston-Tillotson University Diversity Hackathon, 2017",
    "2nd Place — HBCU Battle of the Brains Hackathon, Home Depot Tech Competition, 2018",
    "1st Place — Mentor, Diversity Hackathon, 2018",
    "3rd Place — HomeAway Hackathon, 2018"
  ],

  projects: [
    {
      title: "Pocket LLM",
      tag: "LLM / RAG",
      desc: "A UI that lets you insert PDFs or text files into a vector database and use an LLM to draw context from the vector embeddings of those files.",
      link: "https://github.com/zudevon/pocket_llm"
    },
    {
      title: "Multi-GPU Deep Learning Workstation",
      tag: "Infrastructure",
      desc: "An environment that lets TensorFlow or PyTorch leverage multiple GPU devices on a single machine and benchmark usage across GPUs when training a new network.",
      link: "https://github.com/zudevon/ai-portfolio/tree/main/multi-GPU-setup"
    },
    {
      title: "LangChain Fundamentals",
      tag: "LLM",
      desc: "An intro to LangChain fundamentals covering the core concepts for building LLM-powered applications.",
      link: "https://github.com/zudevon/NLP-Techniques/tree/main/lang_chain"
    },
    {
      title: "NLP Mastery",
      tag: "NLP",
      desc: "A collection of NLP techniques and experiments covering the breadth of natural language processing methods.",
      link: "https://github.com/zudevon/NLP-Techniques/tree/main"
    }
  ],

  interests: [
    "Longboarding down the mountains around Durango, Colorado — preferably far from the Texas heat.",
    "Family time, live hip hop, and a permanent urge to build things.",
    "A reinforcement-learning trading bot that I keep pushing further; I'm fascinated by how AI can learn to read markets at every level.",
    "Data-science blogs, local LLMs, and tinkering with multi-GPU training rigs."
  ],

  /* ── the current AI chapter, curated for the Lab ── */
  ai: {
    summary:
      "I build agentic AI systems end to end — retrieval pipelines, MCP tool servers, multi-step agents, and fine-tuned, self-hosted open-weight models. Recent work spans a “Company Brain” knowledge system and production LLM agents at SciPlay.",
    stack: ["RAG", "Agentic workflows", "MCP", "LoRA / QLoRA", "Vector DBs", "LangChain", "Hugging Face", "OpenAI", "Supabase", "Databricks", "Kubernetes", "MLflow"],
    work: [
      {
        role: "Agentic AI & the “Company Brain”",
        org: "Independent Consultant",
        meta: "Remote",
        dates: "2025 – Present",
        bullets: [
          "Designed multi-step agent workflows, MCP tool servers, and retrieval pipelines over private company data.",
          "Architecting a knowledge system that pipelines meeting transcripts and Notion/Google Docs content into a Supabase vector database for natural-language retrieval.",
          "Fine-tune and self-host open-weight LLMs (LoRA/QLoRA) for clients whose data-governance rules prohibit external model APIs."
        ]
      },
      {
        role: "LLM Agents & Vector Search",
        org: "SciPlay (a Light & Wonder studio)",
        meta: "Austin, TX",
        dates: "2023 – 2025",
        bullets: [
          "Architected LLM-powered agents and RAG systems, including a vector-database incident-triage interface integrating Jira and campaign data.",
          "Piloted MLOps tooling in MLflow and wired experiment-tracked models into downstream data pipelines.",
          "Applied prompt workflows and fine-tuning to anomaly detection, reducing false positives and analyst load."
        ]
      }
    ]
  },

  /* ── collegiate section: add projects/coursework/activities later ── */
  collegiate: {
    note: "More collegiate projects, coursework, and activities are being added. Check back soon.",
    degrees: [
      {
        degree: "M.S. in Data Science",
        school: "Eastern University",
        location: "St. Davids, PA",
        year: "2024",
        detail: "Advanced machine learning, deep learning (TensorFlow, PyTorch), and statistical analysis."
      },
      {
        degree: "B.S. in Mathematics",
        school: "Huston-Tillotson University",
        location: "Austin, TX",
        year: "2019",
        detail: "Quantitative foundation for statistical inference, modeling, and data science."
      }
    ],
    certifications: [
      "Databricks Certified Data Engineer Associate — Credential ID 70165650",
      "Post-Graduate Program in Data Science, Texas McCombs School of Business",
      "Level 3 International RPA Developer, UiPath",
      "Andrew Ng's Stanford Machine Learning Course — Coursera"
    ],
    awards: [
      "1st Place — Emerging Tech Competition, 2017",
      "2nd Place — Diversity Hackathon, 2017",
      "2nd Place — HBCU Battle of the Brains Hackathon, Home Depot Tech Competition, 2018",
      "1st Place — Mentor, Diversity Hackathon, 2018",
      "3rd Place — HomeAway Hackathon, 2018"
    ],
    projects: [],      /* TODO: add collegiate projects */
    coursework: [],    /* TODO: add relevant coursework */
    activities: []     /* TODO: add campus involvement */
  },

  /* ── the world ── */
  world: {
    townName: "PALLET TOWN",
    spawn: { x: 3, y: 18, dir: "up" },
    memorial: "R.I.P. Spiderman, our family pug.",
    npcs: [
      {
        id: "nezuko",
        name: "SCOOTER GIRL",
        lines: ["I'm Nezuko from Demon Slayer!"],
        x: 6, y: 12, minX: 2, maxX: 21,
        dir: "right", speed: 0.18, variant: "a"
      },
      {
        id: "cat",
        name: "SCOOTER GIRL",
        lines: ["I am a cat. Meow."],
        x: 18, y: 18, minX: 2, maxX: 21,
        dir: "left", speed: 0.16, variant: "b"
      }
    ],
    buildings: [
      {
        id: "home",
        name: "YOUR HOUSE",
        section: "about",
        kind: "house",
        accent: "home",
        x: 2, y: 14, w: 4, h: 4,
        door: { x: 3, y: 17 }
      },
      {
        id: "professional",
        name: "GUILD HALL",
        section: "professional",
        kind: "house",
        accent: "guild",
        x: 2, y: 8, w: 4, h: 4,
        door: { x: 3, y: 11 }
      },
      {
        id: "collegiate",
        name: "RIVAL'S HOUSE",
        section: "collegiate",
        kind: "house",
        accent: "rival",
        x: 16, y: 14, w: 4, h: 4,
        door: { x: 17, y: 17 }
      },
      {
        id: "ai",
        name: "THE LAB",
        section: "ai",
        kind: "lab",
        accent: "lab",
        x: 8, y: 3, w: 6, h: 5,
        door: { x: 10, y: 7 }
      },
      {
        id: "life",
        name: "TRAINER CENTER",
        section: "life",
        kind: "center",
        accent: "life",
        x: 16, y: 8, w: 4, h: 4,
        door: { x: 17, y: 11 }
      }
    ]
  },

  /* ── building interiors / guide dialogue ── */
  sections: {
    about: {
      kicker: "BUILDING 01 · YOUR HOUSE",
      title: "TRAINER CARD",
      guide: {
        name: "MOM",
        lines: [
          "There you are! I packed your whole story into this little town.",
          "Start with the card on the table. I'm proud of you."
        ]
      }
    },
    professional: {
      kicker: "BUILDING 02 · GUILD HALL",
      title: "PROFESSIONAL RÉSUMÉ",
      guide: {
        name: "GUILD MASTER",
        lines: [
          "Seven posts, a decade of work, and a few very large numbers.",
          "The full record is on the board. Take your time."
        ]
      }
    },
    collegiate: {
      kicker: "BUILDING 03 · RIVAL'S HOUSE",
      title: "COLLEGIATE RÉSUMÉ",
      guide: {
        name: "RIVAL",
        lines: [
          "You started with mathematics, then data science. Not a bad opening move.",
          "The badges and awards are on the wall."
        ]
      }
    },
    ai: {
      kicker: "BUILDING 04 · THE LAB",
      title: "AI EXPERIENCE",
      guide: {
        name: "PROFESSOR",
        lines: [
          "Agentic workflows, retrieval, fine-tuning... this is where the current experiments live.",
          "The notes are on the terminal. Go ahead."
        ]
      }
    },
    life: {
      kicker: "BUILDING 05 · TRAINER CENTER",
      title: "LIFE & HOBBIES",
      guide: {
        name: "FRIEND",
        lines: [
          "Even trainers rest. Longboards, family, hip hop, and a trading bot.",
          "The good stuff is on the wall."
        ]
      }
    }
  }
};
