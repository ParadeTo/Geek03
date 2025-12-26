import sys
import json
import os
import warnings
import math
from datetime import date, datetime

# 抑制警告和 tqdm 进度条
warnings.filterwarnings("ignore")
os.environ["TQDM_DISABLE"] = "1"

import akshare as ak
import pandas as pd

def clean_data(obj):
    """
    清理数据，将 NaN 转换为 None (JSON null)，将日期转换为字符串
    """
    if isinstance(obj, list):
        return [clean_data(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: clean_data(v) for k, v in obj.items()}
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, (date, datetime)):
        return obj.isoformat()
    else:
        return obj

def handle_get_balance_sheet(stock_code, year):
    if not stock_code.startswith(('SH', 'SZ')):
        stock_code = ('SH' if stock_code.startswith('6') else 'SZ') + stock_code
    
    df = ak.stock_balance_sheet_by_yearly_em(symbol=stock_code)
    if df is None or df.empty:
        return []
    df = df[df['REPORT_DATE'] == f'{year}-12-31 00:00:00']
    return clean_data(df.to_dict(orient="records"))

def handle_get_income_statement(stock_code, year):
    if not stock_code.startswith(('SH', 'SZ')):
        stock_code = ('SH' if stock_code.startswith('6') else 'SZ') + stock_code
    
    df = ak.stock_profit_sheet_by_yearly_em(symbol=stock_code)
    if df is None or df.empty:
        return []
    df = df[df['REPORT_DATE'] == f'{year}-12-31 00:00:00']
    return clean_data(df.to_dict(orient="records"))

def handle_get_cash_flow_statement(stock_code, year):
    if not stock_code.startswith(('SH', 'SZ')):
        stock_code = ('SH' if stock_code.startswith('6') else 'SZ') + stock_code
    
    df = ak.stock_cash_flow_sheet_by_yearly_em(symbol=stock_code)
    if df is None or df.empty:
        return []
    df = df[df['REPORT_DATE'] == f'{year}-12-31 00:00:00']
    return clean_data(df.to_dict(orient="records"))

def handle_get_financial_indicator(stock_code, year):
    # 尝试多种代码格式
    codes_to_try = [stock_code]
    if stock_code.startswith(('SH', 'SZ')):
        codes_to_try.append(stock_code[2:])
    
    last_err = None
    for code in codes_to_try:
        try:
            # 必须传入 start_year，否则返回空
            df = ak.stock_financial_analysis_indicator(symbol=code, start_year=year)
            if df is not None and not df.empty:
                target_date = f'{year}-12-31'
                date_col = '日期' if '日期' in df.columns else df.columns[0]
                df[date_col] = df[date_col].astype(str)
                df = df[df[date_col].str.contains(target_date)]
                return clean_data(df.to_dict(orient="records"))
        except Exception as e:
            last_err = e
            continue
            
    if last_err:
        print(f"Error in handle_get_financial_indicator for {stock_code}: {str(last_err)}", file=sys.stderr)
    return []

def handle_get_top10_shareholders(stock_code):
    """获取十大股东信息"""
    if not stock_code.startswith(('SH', 'SZ', 'sh', 'sz')):
        stock_code = ('sh' if stock_code.startswith('6') else 'sz') + stock_code
    stock_code = stock_code.lower()
    
    try:
        df = ak.stock_gdfx_top_10_em(symbol=stock_code, date="20250331")
        if df is None or df.empty:
            return []
        return clean_data(df.to_dict(orient="records"))
    except Exception as e:
        print(f"Error in handle_get_top10_shareholders: {str(e)}", file=sys.stderr)
        return []

def handle_get_free_top10_shareholders(stock_code):
    """获取十大流通股东信息"""
    if not stock_code.startswith(('SH', 'SZ', 'sh', 'sz')):
        stock_code = ('sh' if stock_code.startswith('6') else 'sz') + stock_code
    stock_code = stock_code.lower()
    
    try:
        df = ak.stock_gdfx_free_top_10_em(symbol=stock_code, date="20250331")
        if df is None or df.empty:
            return []
        return clean_data(df.to_dict(orient="records"))
    except Exception as e:
        print(f"Error in handle_get_free_top10_shareholders: {str(e)}", file=sys.stderr)
        return []

def handle_get_main_stock_holder(stock_code):
    """获取主要股东信息"""
    if stock_code.startswith(('SH', 'SZ', 'sh', 'sz')):
        stock_code = stock_code[2:]
    
    try:
        df = ak.stock_main_stock_holder(stock=stock_code)
        if df is None or df.empty:
            return []
        return clean_data(df.to_dict(orient="records"))
    except Exception as e:
        print(f"Error in handle_get_main_stock_holder: {str(e)}", file=sys.stderr)
        return []

def handle_get_restricted_release(stock_code):
    """获取限售解禁信息"""
    if stock_code.startswith(('SH', 'SZ', 'sh', 'sz')):
        stock_code = stock_code[2:]
    
    try:
        df = ak.stock_restricted_release_queue_sina(symbol=stock_code)
        if df is None or df.empty:
            return []
        return clean_data(df.to_dict(orient="records"))
    except Exception as e:
        print(f"Error in handle_get_restricted_release: {str(e)}", file=sys.stderr)
        return []

def handle_get_stock_intro(stock_code):
    """获取公司基本介绍信息（主营业务、经营范围等）"""
    if stock_code.startswith(('SH', 'SZ', 'sh', 'sz')):
        stock_code = stock_code[2:]
    
    try:
        df = ak.stock_zyjs_ths(symbol=stock_code)
        if df is None or df.empty:
            return []
        return clean_data(df.to_dict(orient="records"))
    except Exception as e:
        print(f"Error in handle_get_stock_intro: {str(e)}", file=sys.stderr)
        return []

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No function name provided"}))
        return

    func_name = sys.argv[1]
    args = sys.argv[2:]

    try:
        if func_name == "get_balance_sheet":
            result = handle_get_balance_sheet(*args)
        elif func_name == "get_income_statement":
            result = handle_get_income_statement(*args)
        elif func_name == "get_cash_flow_statement":
            result = handle_get_cash_flow_statement(*args)
        elif func_name == "get_financial_indicator":
            result = handle_get_financial_indicator(*args)
        elif func_name == "get_top10_shareholders":
            result = handle_get_top10_shareholders(*args)
        elif func_name == "get_free_top10_shareholders":
            result = handle_get_free_top10_shareholders(*args)
        elif func_name == "get_main_stock_holder":
            result = handle_get_main_stock_holder(*args)
        elif func_name == "get_restricted_release":
            result = handle_get_restricted_release(*args)
        elif func_name == "get_stock_intro":
            result = handle_get_stock_intro(*args)
        elif func_name == "generic":
            ak_func_name = args[0]
            ak_func = getattr(ak, ak_func_name)
            ak_args_raw = args[1:]
            
            pos_args = []
            kwargs = {}
            
            for arg in ak_args_raw:
                try:
                    val = json.loads(arg)
                    if isinstance(val, dict):
                        kwargs.update(val)
                    else:
                        pos_args.append(val)
                except:
                    pos_args.append(arg)
            
            # res = ak_func(*pos_args, **kwargs)
            res = ak_func(*pos_args, **kwargs)
            
            if isinstance(res, pd.DataFrame):
                result = clean_data(res.to_dict(orient="records"))
            else:
                result = clean_data(res)
        else:
            print(json.dumps({"error": f"Unknown function: {func_name}"}))
            return

        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))

if __name__ == "__main__":
    main()

