import os
from groq import AsyncGroq
from backend.core.config import settings

class LLMClient:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"  # Default model

    async def generate(self, prompt: str, system_message: str = "You are a helpful assistant.") -> str:
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                model=self.model,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling Groq: {e}")
            return ""

    async def generate_json(self, prompt: str, system_message: str = "You are a helpful assistant.") -> str:
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": system_message + "\nReturn ONLY valid JSON.",
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                model=self.model,
                response_format={"type": "json_object"},
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling Groq (JSON): {e}")
            return "{}"

llm_client = LLMClient()
