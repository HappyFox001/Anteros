import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pytrends.request import TrendReq

app = FastAPI()

pytrends = TrendReq(hl="en-US", tz=360)

realtime_data_cache = {}

@app.get("/search_trends/{keyword}")
async def get_search_trends(keyword: str) -> Dict[str, Any]:
    try:
        end_date = datetime.now()
        start_date_hourly = end_date - timedelta(days=7)
        hourly_timeframe = f"{start_date_hourly.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"

        pytrends.build_payload(kw_list=[keyword], cat=0, timeframe=hourly_timeframe, geo="", gprop="")

        hourly_df = pytrends.interest_over_time()

        await asyncio.sleep(2)

        start_date_monthly = end_date - timedelta(days=365)
        monthly_timeframe = f"{start_date_monthly.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"

        pytrends.build_payload(kw_list=[keyword], cat=0, timeframe=monthly_timeframe, geo="", gprop="")

        monthly_df = pytrends.interest_over_time()

        if not monthly_df.empty and not hourly_df.empty:
            latest_hourly = {date.strftime("%Y-%m-%d %H:%M:%S"): value for date, value in hourly_df[keyword].items()}
            latest_hour_data = list(latest_hourly.values())[-1]
            
            last_30_days = monthly_df.last("30D")
            monthly_dict = {date.strftime("%Y-%m-%d"): value for date, value in last_30_days[keyword].items()}
            monthly_average = sum(monthly_dict.values()) / len(monthly_dict)
            
            yearly_data = []
            for date, value in monthly_df[keyword].items():
                yearly_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "value": value
                })

            return {
                "keyword": keyword,
                "realtime_data": latest_hour_data,
                "realtime_data_list": list(latest_hourly.values()),
                "monthly_data": round(monthly_average, 2),
                "yearly_data": yearly_data,
                "status": "success",
                "note": "Hourly data is relative to past 7 days, monthly data is relative to past year",
            }
        else:
            raise HTTPException(status_code=404, detail="No data found for the specified keyword")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching search trends: {str(e)}")


@app.get("/mock_search_trends/{keyword}")
async def mock_search_trends(keyword: str) -> Dict[str, Any]:
    seed = sum(ord(c) for c in keyword)
    random.seed(seed)

    base_price = 50 + (seed % 50)

    if keyword not in realtime_data_cache:
        realtime_data_cache[keyword] = []
        for i in range(30):
            if i == 0:
                price = base_price
            else:
                last_price = realtime_data_cache[keyword][-1]
                fluctuation_pct = (random.random() * 20 - 10) / 100
                price = last_price * (1 + fluctuation_pct)
            
            if price < 10:
                price = 10
            realtime_data_cache[keyword].append(round(price, 2))
    
    current_time = int(datetime.now().timestamp())
    
    if len(realtime_data_cache[keyword]) == 0 or current_time % 10 != realtime_data_cache.get(f"{keyword}_last_update", 0) % 10:
        if len(realtime_data_cache[keyword]) >= 30:
            realtime_data_cache[keyword].pop(0)
        
        last_price = realtime_data_cache[keyword][-1] if realtime_data_cache[keyword] else base_price
        
        min_fluctuation = -0.05
        max_fluctuation = 0.05

        if len(realtime_data_cache[keyword]) >= 3:
            last_3_prices = realtime_data_cache[keyword][-3:]
            if all(last_3_prices[i] < last_3_prices[i+1] for i in range(len(last_3_prices)-1)):
                min_fluctuation = -0.10
                max_fluctuation = 0.03
            elif all(last_3_prices[i] > last_3_prices[i+1] for i in range(len(last_3_prices)-1)):
                min_fluctuation = -0.03
                max_fluctuation = 0.10
        
        fluctuation_pct = random.uniform(min_fluctuation, max_fluctuation)
        new_price = last_price * (1 + fluctuation_pct)
        
        if new_price < 10:
            new_price = 10
            
        realtime_data_cache[keyword].append(round(new_price, 2))
        realtime_data_cache[f"{keyword}_last_update"] = current_time
    
    while len(realtime_data_cache[keyword]) > 30:
        realtime_data_cache[keyword].pop(0)
    
    realtime_value = realtime_data_cache[keyword][-1]
    
    monthly_data = round(base_price * random.uniform(0.8, 1.2), 1)
    
    yearly_data = []
    yearly_base = base_price
    
    for i in range(30):
        if i == 0:
            yearly_base = base_price
        else:
            trend_factor = math.sin(i / 5) * (yearly_base * 0.03)  # 3%的周期性波动
            random_factor = yearly_base * (random.random() * 0.04 - 0.02)
            
            yearly_base = yearly_base + trend_factor + random_factor
        
        if yearly_base < 10:
            yearly_base = 10
            
        yearly_data.append({
            "date": (datetime.now() - timedelta(days=29-i)).strftime("%Y-%m-%d"),
            "value": round(yearly_base, 2)
        })

    return {
        "keyword": keyword,
        "realtime_data": realtime_value,
        "realtime_data_list": realtime_data_cache[keyword],
        "monthly_data": monthly_data,
        "yearly_data": yearly_data,
        "status": "success",
        "note": "Realtime data shows 30 seconds of price movement, yearly data shows 30 days",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
