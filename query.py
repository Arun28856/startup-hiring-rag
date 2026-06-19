from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True}
)

vectorstore = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings,
    collection_name="startup_hiring"
)

prompt_template = """
You are a startup hiring and compensation expert for the Indian market.
Use only the context provided to answer. Always include salary ranges if present.
If the answer is not in the context, say "I don't have enough data on this."

Context:
{context}

Question: {question}

Answer:
"""

prompt = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4}
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True
)

questions = [
    "What is the expected salary for a GTM associate at an early-stage startup in India?",
    "What skills do B2B SaaS startups look for when hiring presales engineers?",
    "How much equity do Series A startups offer their first 10 hires?"
]

for q in questions:
    result = qa_chain({"query": q})
    print(f"\nQ: {q}")
    print(f"A: {result['result']}")
    print("Sources:")
    for doc in result["source_documents"]:
        print(f"  - {doc.metadata} | {doc.page_content[:80]}...")
