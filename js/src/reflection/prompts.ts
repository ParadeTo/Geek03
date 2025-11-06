export const COMMAND_PROMPT = `你是一个资深Linux运维专家，请根据用户需求生成最合适的Linux命令。

要求：
1. 只输出可直接执行的命令
2. 优先使用性能最好的方案

用户需求：{user_query}
当前方案：{best_command}
改进建议：{reflection}

请按以下格式输出：
命令：<生成的命令>`

export const REFLECTION_PROMPT = `请严格检查以下Linux命令的合理性：
{command}

检查维度：
1. 是否符合POSIX标准
2. 是否有更高效的替代方案
3. 是否完全解决用户需求
4. 是否好维护

用户原始需求：{user_query}

请返回结构化的检查结果：
- needsImprovement: 是否需要改进（true/false）
- suggestions: 改进建议（包含发现的问题和具体优化方向，如果无需改进则说明"已达最优"）`
