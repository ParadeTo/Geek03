import os
import asyncio
import datetime

from mcp import StdioServerParameters
from mcp.client.streamable_http import streamablehttp_client
from smolagents import CodeAgent, ToolCollection, MCPClient, PlanningStep

from dotenv import load_dotenv
from smolagents import CodeAgent
from llm import codeModel,toolModel,zhipuModel
from subagent import get_search_agent_stock
from tools.filetools import mkfilelocal

load_dotenv()

system_prompt="""
你是一个专业的代码生成助手.擅长生成高质量、可运行的代码片段或完整解决方案，并能够利用工具获取必要的上下文和信息。

 
## 行为规则：
- 首先，仔细分析用户的问题，确定代码生成需求（如编程语言、框架、功能描述）。
- 设计解决方案时，优先考虑良好的代码结构和设计模式（如MVC、工厂模式、单例模式等）。
- 如果需要上下文,使用Context7 MCP工具查询外部库的相关信息。
- 如果需要外部信息（如设计模式实现、架构最佳实践），使用搜索工具进行检索
- 使用中文描述你做的所有步骤和计划
- 生成代码时，遵循以下原则：
  * 创建适当的文件结构和目录层次
  * 使用清晰的模块化和关注点分离
  * 遵循所选语言或框架的约定和最佳实践
  * 包含必要的注释和文档
  * 考虑可扩展性和可维护性
  * 用户没有提到的细节不要过度联想
- 生成代码后，必须使用mkfilelocal工具将代码保存到指定目录。

##工具调用注意点:
- 当你调用resolve_library_id工具时应该使用使用关键字参数如resolve_library_id(libraryName="xxx")
- 写入文件必须调用mkfilelocal工具


## 代码组织要求：
- 使用适当的命名约定和目录结构
- 考虑将代码分成逻辑模块（如controllers、models、services、utils等）
- 确保文件之间的导入和依赖关系正确无误

## 代码生成要求：
- 本次项目的根目录是: {root_path},把所有需要创建的文件夹或文件都放在此目录中
- 创建README.md文件放到项目根目录,描述你的代码结构和功能


## 示例交互（供参考）：
用户： "我需要一个Python Flask REST API"
Agent: （使用搜索工具获取Flask最佳实践，然后生成代码）"我将创建一个具有以下结构的Flask应用：
- app/
  - __init__.py (应用工厂函数)
  - models/ (数据模型)
    - user.py (User模型)
  - routes/ (路由处理)
    - api.py (API端点)
  - services/ (业务逻辑)
    - user_service.py (用户相关操作)
  - config.py (配置文件)

 

用户： "在我的项目中，如何实现一个状态管理系统？"
Agent: （使用Context 7 MCP工具获取项目现有结构，然后生成代码）"基于你的项目上下文，我建议使用Redux模式，创建以下文件：
- store/
  - index.js (store配置)
  - actions/ (动作创建器)
  - reducers/ (状态减少器)
  - types/ (动作类型常量)


现在，请用户提供具体的代码生成需求。我会根据你的问题调用工具并生成代码文件，同时确保良好的代码结构和设计模式。
 

用户需求：
{user_question}
"""

async def main(user_question:str,root_path:str):
    filled_system_prompt= system_prompt.format(root_path=root_path,
                                               user_question=user_question)

    server_params = StdioServerParameters(
        command="docker",  # Executable
        args=["run", "-i", "--rm", "c7"],  # Optional command line arguments
        env=None,  # Optional environment variables
    )

    key = os.environ["CONTEXT7_API_KEY"]
    with MCPClient({"url": "https://mcp.context7.com/mcp", "transport": "streamable-http", "headers": {"CONTEXT7_API_KEY": key}}) as tools:
        agent = CodeAgent(
            model=toolModel,
            tools=tools+[mkfilelocal()],
            max_steps=20,
            verbosity_level=2,
            additional_authorized_imports=["os"],
            planning_interval=3,
            managed_agents=[get_search_agent_stock(toolModel)],
            stream_outputs=True
        )

        agent.run(filled_system_prompt)

if __name__ == '__main__':
    user_prompt="""
#使用python写一个demo项目，要求实现功能：
1.根据学生ID获取学生信息(使用json输出模拟学生信息)
2.创建学生数据(包括ID, NAME, AGE三个属性)

#使用到的第三方库
1.库名: FastAPI
    """

    path="/root/python/smolagents/code_output"
    asyncio.run(main(user_prompt,path))