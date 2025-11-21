"""
Utility functions for job scraping with error handling and retry logic.
"""
import asyncio
from typing import Callable, Any
import functools


def retry_async(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Decorator to retry async functions with exponential backoff.
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries in seconds  
        backoff: Multiplier for delay on each retry
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            current_delay = delay
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        print(f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {str(e)}")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        print(f"All {max_attempts} attempts failed for {func.__name__}: {str(e)}")
            
            # If all retries failed, return empty list instead of raising
            return []
        
        return wrapper
    return decorator
