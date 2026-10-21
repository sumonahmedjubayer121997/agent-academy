import type { ResourceSpec } from './types'

// All URLs verified 2026-10-21 (official roots or confirmed-live pages).
export const RESOURCES: ResourceSpec[] = [
  // Phase 1
  { title: 'The Python Tutorial (official)', url: 'https://docs.python.org/3/tutorial/', provider: 'Python Software Foundation', free: true, why: 'The authoritative core-language walkthrough; use it as your reference while doing exercises, not as a book to read cover-to-cover.', prereqs: 'Basic programming (you have it)', supports: 'Phase 1 · Python core' },
  { title: 'Real Python', url: 'https://realpython.com/', provider: 'Real Python', free: true, why: 'Deep, well-edited tutorials on exactly the gaps you flagged: OOP, packaging, virtual environments, asyncio. Core is free; some courses are paid.', prereqs: 'None', supports: 'Phase 1 · all modules' },
  { title: 'NumPy — the absolute basics', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', provider: 'NumPy', free: true, why: 'Vectorised thinking from zero, straight from the source.', prereqs: 'Python basics', supports: 'Phase 1 · Data stack' },
  { title: 'pandas Getting Started', url: 'https://pandas.pydata.org/docs/getting_started/index.html', provider: 'pandas', free: true, why: 'Official guides and cheat sheets for the data wrangling you will do in every ML and agent-data project.', prereqs: 'NumPy basics', supports: 'Phase 1 · Data stack' },
  { title: 'Pro Git (book)', url: 'https://git-scm.com/book/en/v2', provider: 'git-scm', free: true, why: 'The canonical Git book, free online; chapters 2–3 cover 95% of daily workflow.', prereqs: 'None', supports: 'Phase 1 · Git & testing' },
  { title: 'SQLBolt', url: 'https://sqlbolt.com/', provider: 'SQLBolt', free: true, why: 'Interactive SQL lessons you can finish in two sittings — the fastest honest route to JOIN fluency.', prereqs: 'None', supports: 'Phase 1 · SQL' },

  // Phase 2
  { title: 'Essence of Linear Algebra', url: 'https://www.3blue1brown.com/topics/linear-algebra', provider: '3Blue1Brown', free: true, why: 'The geometric intuition for vectors, matrices, and transformations — watch before any formal text; the dot-product chapter is this platform\'s embeddings lesson in video form.', prereqs: 'High-school math', supports: 'Phase 2 · Linear algebra' },
  { title: 'StatQuest (YouTube)', url: 'https://www.youtube.com/@statquest', provider: 'Josh Starmer', free: true, why: 'Crystal-clear statistics and ML-method explainers — ideal for the probability refresh and metric intuition.', prereqs: 'None', supports: 'Phase 2 · Probability & ML' },
  { title: 'scikit-learn User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', provider: 'scikit-learn', free: true, why: 'The best-written ML docs on the internet: every algorithm page includes the exact evaluation methodology interviews probe.', prereqs: 'Python + NumPy/pandas', supports: 'Phase 2 · ML core & engineering' },
  { title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn', provider: 'Kaggle', free: true, why: 'Free micro-courses with in-browser exercises; use "Intro/Intermediate Machine Learning" for hands-on reps alongside sklearn docs.', prereqs: 'Python basics', supports: 'Phase 2 · ML core' },

  // Phase 3
  { title: 'PyTorch Tutorials (official)', url: 'https://pytorch.org/tutorials/', provider: 'PyTorch', free: true, why: 'From tensors to training loops to transfer learning — the official path, kept current.', prereqs: 'Python, NumPy, calculus basics', supports: 'Phase 3 · PyTorch' },
  { title: 'Neural Networks: Zero to Hero', url: 'https://karpathy.ai/zero-to-hero.html', provider: 'Andrej Karpathy', free: true, why: 'Builds backprop and then a GPT from scratch, line by line — the single best deep-learning foundation available free.', prereqs: 'Python, calculus comfort', supports: 'Phase 3 · NN fundamentals & attention' },
  { title: 'Attention Is All You Need (paper)', url: 'https://arxiv.org/abs/1706.03762', provider: 'arXiv', free: true, why: 'The transformer paper. Read it after Karpathy\'s "Let\'s build GPT" — it will feel earned.', prereqs: 'Attention basics', supports: 'Phase 3 · Attention & transformers' },
  { title: 'Hugging Face LLM Course', url: 'https://huggingface.co/learn', provider: 'Hugging Face', free: true, why: 'Free official courses on transformers, fine-tuning, and agents; the NLP/LLM track pairs directly with Phases 3–4.', prereqs: 'Python + PyTorch basics', supports: 'Phases 3–4 · LLM engineering' },

  // Phase 4
  { title: 'OpenAI API docs — function calling', url: 'https://developers.openai.com/api/docs/guides/function-calling', provider: 'OpenAI', free: true, why: 'The canonical tool-call round trip: schemas, execution, results. (Docs verified at their new home.)', prereqs: 'Async Python', supports: 'Phase 4 · Function calling' },
  { title: 'Anthropic prompt engineering docs', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', provider: 'Anthropic', free: true, why: 'System-prompt and structure techniques from a model provider whose docs read like engineering guides.', prereqs: 'LLM API basics', supports: 'Phase 4 · Prompting' },
  { title: 'Prompt Engineering Guide', url: 'https://www.promptingguide.ai/', provider: 'DAIR.AI (community)', free: true, why: 'Comprehensive, regularly updated catalogue of techniques; treat as a reference, not a curriculum.', prereqs: 'None', supports: 'Phase 4 · Prompting' },

  // Phase 5
  { title: 'PyMuPDF docs', url: 'https://pymupdf.readthedocs.io/en/latest/', provider: 'PyMuPDF', free: true, why: 'Robust PDF parsing for ingestion pipelines; the docs include layout-preserving extraction examples.', prereqs: 'Python', supports: 'Phase 5 · Ingestion' },
  { title: 'Chroma docs', url: 'https://docs.trychroma.com/', provider: 'Chroma', free: true, why: 'The gentlest vector DB to start with: local, embedded, Pythonic. Concepts transfer to Qdrant/pgvector/Pinecone.', prereqs: 'Embeddings', supports: 'Phase 5 · Vector search' },
  { title: 'Cohere Rerank docs', url: 'https://docs.cohere.com/docs/rerank-overview', provider: 'Cohere', free: true, why: 'Clear conceptual explanation of why reranking lifts retrieval quality, plus API reference.', prereqs: 'Hybrid retrieval basics', supports: 'Phase 5 · Reranking' },

  // Phase 6
  { title: 'Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents', provider: 'Anthropic', free: true, why: 'The definitive short paper on workflows vs agents, tool design, and when NOT to add autonomy.', prereqs: 'LLM API + function calling', supports: 'Phase 6 · Agent mental model & loop' },
  { title: 'LangGraph docs', url: 'https://docs.langchain.com/oss/python/langgraph/overview', provider: 'LangChain', free: true, why: 'Your primary orchestration framework: state graphs, checkpointing, and human-in-the-loop interrupts. (Docs verified at their new home.)', prereqs: 'Agent loop (build it bare-metal first)', supports: 'Phase 6 · LangGraph' },
  { title: 'MCP documentation', url: 'https://modelcontextprotocol.io', provider: 'Model Context Protocol', free: true, why: 'Official spec + SDKs for the emerging standard connecting agents to tools and data. Start with "Architecture".', prereqs: 'Tool design basics', supports: 'Phase 6 · MCP' },

  // Phase 7
  { title: 'FastAPI docs', url: 'https://fastapi.tiangolo.com/', provider: 'FastAPI', free: true, why: 'Among the best docs in software, period. The tutorial is a genuine backend course in itself.', prereqs: 'Python + Pydantic comfort', supports: 'Phase 7 · FastAPI' },
  { title: 'Docker docs — Get started', url: 'https://docs.docker.com/get-started/', provider: 'Docker', free: true, why: 'Official hands-on path from images to compose; the Python-specific guides map directly onto your FastAPI service.', prereqs: 'None', supports: 'Phase 7 · Docker' },
  { title: 'OWASP Top 10 for LLM Applications', url: 'https://genai.owasp.org/llm-top-10/', provider: 'OWASP', free: true, why: 'The security checklist mindset for prompt injection, data leakage, and excessive agency — your Phase 7 threat model.', prereqs: 'Agent basics', supports: 'Phase 7 · Security' },
  { title: 'OpenTelemetry docs', url: 'https://opentelemetry.io/docs/', provider: 'CNCF', free: true, why: 'Vendor-neutral tracing standard; the concepts here underpin every observability tool you will use.', prereqs: 'Backend basics', supports: 'Phase 7 · Observability' },

  // Phase 8
  { title: 'DeepLearning.AI short courses', url: 'https://www.deeplearning.ai/courses/', provider: 'DeepLearning.AI', free: true, why: 'Free 1–2 hour courses on agents, RAG, and evals — good refreshers and certificates; the paid specialisations are optional.', prereqs: 'Varies by course', supports: 'Phases 4–8 · Reinforcement' },
]
