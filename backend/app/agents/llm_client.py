import os
import asyncio
from groq import AsyncGroq
from backend.core.config import settings

class LLMClient:
    def __init__(self):
        self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"  # Default model

    async def _retry_on_rate_limit(self, func, *args, **kwargs):
        max_retries = 5
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_msg = str(e).lower()
                if "rate_limit_exceeded" in error_msg or "429" in error_msg:
                    if attempt == max_retries - 1:
                        print(f"Max retries reached for rate limit: {e}")
                        raise e
                    
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limit hit. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    raise e

    async def generate(self, prompt: str, system_message: str = "You are a helpful assistant.") -> str:
        try:
            chat_completion = await self._retry_on_rate_limit(
                self.client.chat.completions.create,
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
            chat_completion = await self._retry_on_rate_limit(
                self.client.chat.completions.create,
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
