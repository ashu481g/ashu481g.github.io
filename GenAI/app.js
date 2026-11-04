// Course data: every module and topic from the KOED "Generative AI Modules" PDF,
// each with free YouTube videos that teach it.
const MODULES = [
  {
    id: "m1",
    label: "Module 1",
    title: "Foundations of Generative AI: Tools & Frameworks",
    intro: "Use the main AI coding and building tools, from chatbots to deployment.",
    topics: [
      { name: "Code generation with ChatGPT", videos: [
        { title: "Learn to Code using AI - ChatGPT Programming Tutorial (Full Course)", channel: "freeCodeCamp.org", url: "https://www.youtube.com/watch?v=dJhlMn2otxA" },
        { title: "How to Generate Code with ChatGPT", url: "https://www.youtube.com/watch?v=lJwD4X-GKvw" } ] },
      { name: "Creating a website using Claude AI", videos: [
        { title: "How to Use Claude AI to Build a Website - Tutorial", url: "https://www.youtube.com/watch?v=PTW_FF6zCKs" },
        { title: "How to Create a Website with Claude for FREE", url: "https://www.youtube.com/watch?v=hFhvEaRHA6M" } ] },
      { name: "Code generation and modification with GitHub Copilot", videos: [
        { title: "Getting started with GitHub Copilot", url: "https://www.youtube.com/watch?v=n0NlxUyA7FI" },
        { title: "Coding with GitHub Copilot: A practical VS Code tutorial", url: "https://www.youtube.com/watch?v=jp75SVVX0vI" } ] },
      { name: "Claude Code", videos: [
        { title: "Claude Code Tutorial for Beginners", url: "https://www.youtube.com/watch?v=AYQiDc0BV4o" },
        { title: "Claude Code - Full Tutorial for Beginners (2026)", url: "https://www.youtube.com/watch?v=E7OQNn6xJKg" } ] },
      { name: "Codex (OpenAI)", videos: [
        { title: "Getting started with Codex", url: "https://www.youtube.com/watch?v=px7XlbYgk7I" },
        { title: "OpenAI Codex Complete Tutorial", url: "https://www.youtube.com/watch?v=h-aSOm4Gkr0" } ] },
      { name: "Website hosting using Vercel", videos: [
        { title: "How to Deploy a Website on Vercel for FREE (Beginner Tutorial 2026)", url: "https://www.youtube.com/watch?v=1HN3RaYb7xo" },
        { title: "How to Deploy Your Website for Free Using Vercel and GitHub", url: "https://www.youtube.com/watch?v=bKyNJsP8h2o" } ] },
      { name: "Building in VS Code using AI", videos: [
        { title: "VS Code Agent Mode: GitHub Copilot Agent Mode Explained", url: "https://www.youtube.com/watch?v=yNmtZSAQbKw" },
        { title: "Build Your First AI Agent in VS Code with GitHub Copilot", url: "https://www.youtube.com/watch?v=MkhDbpFez8Y" } ] },
      { name: "Prompt engineering (listed under skills)", videos: [
        { title: "Master AI Prompt Engineering - Full Course for Beginners (ChatGPT, Gemini, Claude)", url: "https://www.youtube.com/watch?v=kQRMXzp6YJY" } ] },
      { name: "Tools covered: GPT-5, Gemini and Sora", videos: [
        { title: "ChatGPT 5 Explained (2026)", url: "https://www.youtube.com/watch?v=59OxteIue-4" },
        { title: "Google Gemini AI Explained", url: "https://www.youtube.com/watch?v=b2kch23iNsg" },
        { title: "Sora 2 Tutorial: Intro to AI Video Creation for Beginners", url: "https://www.youtube.com/watch?v=0HP4UbtbIvw" } ] }
    ]
  },
  {
    id: "m2",
    label: "Module 2",
    title: "Model Context Protocol (AI & Technology)",
    intro: "Connect AI to outside tools, set up API keys, and build agents, sub-agents, skills and connectors.",
    topics: [
      { name: "What are MCPs?", videos: [
        { title: "Model Context Protocol Clearly Explained | MCP Beyond the Hype (codebasics)", url: "https://www.youtube.com/watch?v=tzrwxLNHtRY" },
        { title: "What Is MCP (Model Context Protocol)? Explained Simply", url: "https://www.youtube.com/watch?v=8IPwd1STaBc" } ] },
      { name: "How to connect MCP servers, API keys and usage", videos: [
        { title: "Add Your First MCP Server to Claude Code in 2 Minutes (2026)", url: "https://www.youtube.com/watch?v=BPPQ2_rCfR4" },
        { title: "How to Add MCP to Claude Code (Step-by-Step Guide)", url: "https://www.youtube.com/watch?v=dHm2IIIevz0" } ] },
      { name: "Building your own MCP server", videos: [
        { title: "How to Build Your First MCP Server (in Less Than 5 Minutes)", url: "https://www.youtube.com/watch?v=Y4bpWRLdRoA" },
        { title: "Make Claude Code Do Anything - Custom MCP Server Tutorial", url: "https://www.youtube.com/watch?v=eXqSmNS-QtM" } ] },
      { name: "Creating agents and sub-agents", videos: [
        { title: "How to Create Sub Agents in Claude Code (2026)", url: "https://www.youtube.com/watch?v=ICgTn1JMU9Y" },
        { title: "Claude Code NEW Sub Agents in 7 Minutes", url: "https://www.youtube.com/watch?v=DNGxMX7ym44" } ] },
      { name: "Creating skills and connectors", videos: [
        { title: "Claude Skills Explained - Step-by-Step Tutorial for Beginners", url: "https://www.youtube.com/watch?v=wO8EboopboU" },
        { title: "Claude Skills Tutorial (2026): Build, Run, and Share", url: "https://www.youtube.com/watch?v=O_z9vDLgvoY" } ] },
      { name: "Using VS Code with AI", videos: [
        { title: "Build Your First AI Agent in VS Code with GitHub Copilot", url: "https://www.youtube.com/watch?v=MkhDbpFez8Y" } ] }
    ]
  },
  {
    id: "m3",
    label: "Module 3",
    title: "Generative AI for Leaders",
    intro: "Strategy, economics, workforce, ethics and business use cases, aimed at decision makers.",
    topics: [
      { name: "GenAI in leadership: transforming industries", videos: [
        { title: "Generative AI For Leaders Full Course (2026)", url: "https://www.youtube.com/watch?v=1NMM9Q_TjxE" },
        { title: "HBR Guide to Generative AI for Managers", url: "https://www.youtube.com/watch?v=xWIIuoIS9fw" } ] },
      { name: "Optimising AI for executive decision-making", videos: [
        { title: "IBM Generative AI Course for Executives & Business Leaders", url: "https://www.youtube.com/watch?v=1jvdAzuBn2o" },
        { title: "Generative AI: The Secret Weapon Of Successful CEOs", url: "https://www.youtube.com/watch?v=Iabhe1nx6kI" } ] },
      { name: "Economic impact of GenAI (company and macro level)", videos: [
        { title: "Michael Chui: The Economic Impact of Generative AI", url: "https://www.youtube.com/watch?v=6iX92Pj7wIc" },
        { title: "The economic potential of generative AI: The next productivity frontier", url: "https://www.youtube.com/watch?v=4-Hk2zUz5xs" } ] },
      { name: "AI workforce and talent strategy", videos: [
        { title: "AI Is Changing Talent Strategy - Here's How Executives Should Respond", url: "https://www.youtube.com/watch?v=Vx3pmJT0V9k" },
        { title: "How To Leverage Generative AI In HR", url: "https://www.youtube.com/watch?v=DXUIH0OdxDY" } ] },
      { name: "Ethical and responsible use of GenAI", videos: [
        { title: "AI Ethics Course: How to Use AI Responsibly in Business", url: "https://www.youtube.com/watch?v=xKy9SyaQDN8" },
        { title: "What is Responsible AI", url: "https://www.youtube.com/watch?v=7cInNcogQxg" } ] },
      { name: "Future trends: hyper-personalisation, agentic AI and AI-driven strategy", videos: [
        { title: "What is Hyper-Personalization? Artificial Intelligence", url: "https://www.youtube.com/watch?v=u2UgY2L2CFU" },
        { title: "The Future of AI Agents in 2026: Architectures, Adoption, and Governance", url: "https://www.youtube.com/watch?v=T-U5-451T_w" } ] },
      { name: "Applications in marketing, operations, HR and finance", videos: [
        { title: "7 Ways Marketers Should Use Generative AI", url: "https://www.youtube.com/watch?v=hc9ZcFGhcNI" },
        { title: "Generative AI: Top 5 Use Cases for Finance Professionals", url: "https://www.youtube.com/watch?v=hnsL0LV2k20" },
        { title: "How AI is Revolutionizing HR", url: "https://www.youtube.com/watch?v=Vz8mNnltlAI" },
        { title: "How to Use Generative AI for Business: Data Analysis, Sales & Customer Support", url: "https://www.youtube.com/watch?v=k0OBIKxQ5tE" } ] }
    ]
  },
  {
    id: "m4",
    label: "Agentic AI",
    title: "Agentic AI: Reading, Masterclasses, Tools and Frameworks",
    intro: "What agentic AI is, how multi-agent systems work, and the frameworks that build them.",
    topics: [
      { name: "Agentic AI overview", videos: [
        { title: "What is Agentic AI and How Does it Work?", url: "https://www.youtube.com/watch?v=15_pppse4fY" },
        { title: "What is Agentic AI? An Easy Explanation For Everyone", url: "https://www.youtube.com/watch?v=-pqzyvRp3Tc" } ] },
      { name: "Applications of agentic AI", videos: [
        { title: "Agentic AI Explained, How AI Agents Actually Work", url: "https://www.youtube.com/watch?v=bzi3ii7CeCc" } ] },
      { name: "What is not agentic AI", videos: [
        { title: "Generative AI vs AI agents vs Agentic AI", url: "https://www.youtube.com/watch?v=O2gerCxEXvc" },
        { title: "AI Agent vs Agentic AI: What's the Difference?", url: "https://www.youtube.com/watch?v=QZT8NORYJc4" } ] },
      { name: "Case compendium and architecture", videos: [
        { title: "Agentic AI Architecture Explained", url: "https://www.youtube.com/watch?v=2gBAhZcEedM" } ] },
      { name: "Masterclass: building with AutoGen", videos: [
        { title: "AutoGen Tutorial for Beginners: Build Your First Multi-Agent App", url: "https://www.youtube.com/watch?v=KCoBVe-3Rp8" } ] },
      { name: "Masterclass: LangChain agents", videos: [
        { title: "LangChain Tutorial for Beginners: Build an AI Agent with Memory", url: "https://www.youtube.com/watch?v=O0Cj4nef21Q" } ] },
      { name: "Masterclass: CrewAI multi-agent teams", videos: [
        { title: "CrewAI Tutorial for Beginners", url: "https://www.youtube.com/watch?v=dAXHHlzk4VY" } ] },
      { name: "Orchestrating multi-agent systems", videos: [
        { title: "Multi-Agent Orchestration Explained: From Patterns to Production", url: "https://www.youtube.com/watch?v=EtSO9vU84ws" } ] },
      { name: "Multimodal AI (Gemini, GPT-4V)", videos: [
        { title: "What Is Google Gemini? Google's Multimodal AI Explained Simply", url: "https://www.youtube.com/watch?v=NHClMKjtQ2c" } ] },
      { name: "Hugging Face", videos: [
        { title: "Getting Started With Hugging Face in 15 Minutes", url: "https://www.youtube.com/watch?v=QEaBAZQCtwE" } ] },
      { name: "GenAI and LLM architecture", videos: [
        { title: "Large Language Models (LLMs) - Everything You NEED To Know", url: "https://www.youtube.com/watch?v=osKyvYJ3PRM" },
        { title: "Transformers Explained Visually: Learn How LLM Transformer Models Work", url: "https://www.youtube.com/watch?v=ECR4oAwocjs" },
        { title: "[1hr Talk] Intro to Large Language Models", url: "https://www.youtube.com/watch?v=zjkBMFhNj_g" } ] }
    ]
  },
  {
    id: "m5",
    label: "Projects",
    title: "The Two Course Projects",
    intro: "Build the two projects from the course.",
    topics: [
      { name: "Project: AI customer support chatbot using Claude", videos: [
        { title: "Python AI Chatbot with Anthropic's Claude API", url: "https://www.youtube.com/watch?v=i-EZvYfWWUA" },
        { title: "RAG + Claude AI Chatbot Tutorial: Build a Smart Customer Support Bot in Python", url: "https://www.youtube.com/watch?v=8jK9tmN-IHs" } ] },
      { name: "Project: AI image caption generator", videos: [
        { title: "Image Caption Generator with CNN & LSTM", url: "https://www.youtube.com/watch?v=yWAhC95n5RM" },
        { title: "AI-Powered Image Caption Generator", url: "https://www.youtube.com/watch?v=0-KO7C5VfDo" } ] }
    ]
  }
];

(function () {
  const STORE_KEY = "genai-path-watched-v1";

  function loadWatched() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveWatched(map) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(map));
    } catch (e) {
      /* storage blocked: the page still works, progress just isn't kept */
    }
  }

  const watched = loadWatched();
  const allVideoIds = [];

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function updateProgress() {
    const done = allVideoIds.filter((id) => watched[id]).length;
    const total = allVideoIds.length;
    document.getElementById("progress-count").textContent = done + " of " + total + " videos marked watched";
    document.getElementById("progress-fill").style.width = (total ? (done / total) * 100 : 0) + "%";
    MODULES.forEach((m) => {
      const count = document.getElementById("nav-" + m.id);
      if (!count) return;
      const ids = m.topics.flatMap((t) => t.videos.map((v) => v.url));
      count.textContent = ids.filter((u) => watched[u]).length + "/" + ids.length;
    });
  }

  function videoRow(video) {
    const row = el("li", "video");
    const label = el("label", "video-check");
    const box = el("input");
    box.type = "checkbox";
    box.id = "v-" + allVideoIds.indexOf(video.url);
    box.checked = !!watched[video.url];
    box.addEventListener("change", () => {
      if (box.checked) watched[video.url] = true;
      else delete watched[video.url];
      saveWatched(watched);
      row.classList.toggle("is-done", box.checked);
      updateProgress();
    });
    label.setAttribute("for", box.id);
    label.appendChild(box);
    label.appendChild(el("span", "sr-only", "Mark as watched"));
    row.appendChild(label);
    if (box.checked) row.classList.add("is-done");

    const body = el("div", "video-body");
    const link = el("a", "video-link", video.title);
    link.href = video.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    body.appendChild(link);
    if (video.channel) body.appendChild(el("div", "video-meta", video.channel));
    row.appendChild(body);
    row.appendChild(el("span", "video-open", "Open ↗"));
    return row;
  }

  function render() {
    const nav = document.getElementById("module-nav");
    const main = document.getElementById("modules");

    MODULES.forEach((m) => {
      const link = el("a", "nav-item");
      link.href = "#" + m.id;
      link.appendChild(el("span", "nav-label", m.label));
      link.appendChild(el("span", "nav-count", "0/0"));
      link.lastChild.id = "nav-" + m.id;
      nav.appendChild(link);

      const section = el("section", "module");
      section.id = m.id;
      const head = el("header", "module-head");
      head.appendChild(el("p", "module-label", m.label));
      head.appendChild(el("h2", "module-title", m.title));
      head.appendChild(el("p", "module-intro", m.intro));
      section.appendChild(head);

      m.topics.forEach((t) => {
        const topic = el("article", "topic");
        topic.appendChild(el("h3", "topic-name", t.name));
        const list = el("ul", "video-list");
        t.videos.forEach((v) => {
          if (allVideoIds.indexOf(v.url) === -1) allVideoIds.push(v.url);
          list.appendChild(videoRow(v));
        });
        topic.appendChild(list);
        section.appendChild(topic);
      });
      main.appendChild(section);
    });

    updateProgress();
  }

  render();
})();
