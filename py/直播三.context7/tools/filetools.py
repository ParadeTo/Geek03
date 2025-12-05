from smolagents import Tool
import os

class mkdirlocal(Tool):
    name = "mkdirlocal"
    description = "用于在本地创建目录。当需要创建新的目录结构时，应调用此工具"
    inputs =  {
               "path":
                  {"type": "string", "description": "文件夹路径"}
              }
    output_type = "string"

    def __init__(self, max_results: int = 10, engine: str = "duckduckgo"):
        super().__init__()

    def forward(self, path:str) -> str:
         os.makedirs(path, exist_ok=True)
         return f"{path}创建成功"

class mkfilelocal(Tool):
    name = "mkfilelocal"
    description = "本地创建文件工具,涉及到本地创建文件必须调用此工具"
    inputs = {
                "data":
                  {"type": "string", "description": "文件内容"},
               "path":
                  {"type": "string", "description": "文件路径"}
              }
    output_type = "string"

    def __init__(self, max_results: int = 10, engine: str = "duckduckgo"):
        super().__init__()

    def forward(self, data: str,path:str) -> str:
        dir_path = os.path.dirname(path)

        # 如果目录路径不为空且不存在，则创建目录
        if dir_path and not os.path.exists(dir_path):
            try:
                os.makedirs(dir_path)
                print(f"目录已创建: {dir_path}")
            except OSError as e:
                return f"创建目录时出错: {e}"
        with open(path, 'w',encoding='utf-8') as f:
             f.write(data)
        return f"{path}创建成功"