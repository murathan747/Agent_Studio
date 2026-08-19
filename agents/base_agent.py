"""
Base Agent Module for AgentStudio
Enables modular node-based agent orchestration (LLM, Vision, Game Design, VFX)
"""

from typing import Dict, Any, Optional

class BaseNodeAgent:
    def __init__(self, name: str, role: str = "Assistant"):
        self.name = name
        self.role = role

    async def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent logic for a specific node step.
        """
        raise NotImplementedError("Subclasses must implement execute()")
