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

    base_price = 50 + (seed % 30)

    if keyword not in realtime_data_cache:
        realtime_data_cache[keyword] = []
        for i in range(30):
            if i == 0:
                price = base_price
            else:
                last_price = realtime_data_cache[keyword][-1]
                fluctuation_pct = (random.random() * 4 - 2) / 100
                price = last_price * (1 + fluctuation_pct)
            if price < 10:
                price = 10
            realtime_data_cache[keyword].append(round(price, 2))
    
    current_time = int(datetime.now().timestamp())
    
    if len(realtime_data_cache[keyword]) == 0 or current_time % 10 != realtime_data_cache.get(f"{keyword}_last_update", 0) % 10:
        if len(realtime_data_cache[keyword]) >= 30:
            realtime_data_cache[keyword].pop(0)
        
        last_price = realtime_data_cache[keyword][-1] if realtime_data_cache[keyword] else base_price

        min_fluctuation = -0.015
        max_fluctuation = 0.015

        if len(realtime_data_cache[keyword]) >= 3:
            last_3_prices = realtime_data_cache[keyword][-3:]
            if all(last_3_prices[i] < last_3_prices[i+1] for i in range(len(last_3_prices)-1)):
                min_fluctuation = -0.02
                max_fluctuation = 0.01
            elif all(last_3_prices[i] > last_3_prices[i+1] for i in range(len(last_3_prices)-1)):
                min_fluctuation = -0.01
                max_fluctuation = 0.02
        
        fluctuation_pct = (random.random() * (max_fluctuation - min_fluctuation) + min_fluctuation)

        stability_factor = 0.05 * (base_price - last_price) / base_price
        fluctuation_pct += stability_factor
        
        new_price = last_price * (1 + fluctuation_pct)

        max_allowed = base_price * 1.15
        min_allowed = base_price * 0.85
        if new_price > max_allowed:
            new_price = max_allowed
        elif new_price < min_allowed:
            new_price = min_allowed
            
        if new_price < 10:
            new_price = 10
            
        realtime_data_cache[keyword].append(round(new_price, 2))
        realtime_data_cache[f"{keyword}_last_update"] = current_time
    
    while len(realtime_data_cache[keyword]) > 30:
        realtime_data_cache[keyword].pop(0)
    
    realtime_value = realtime_data_cache[keyword][-1]
    
    monthly_data = round(base_price * random.uniform(0.95, 1.05), 1)
    
    yearly_data = []
    yearly_base = base_price
    
    for i in range(30):
        if i == 0:
            yearly_base = base_price
        else:
            trend_factor = math.sin(i / 5) * (yearly_base * 0.01)
            random_factor = yearly_base * (random.random() * 0.01 - 0.005)
            
            stability_factor = 0.02 * (base_price - yearly_base) / base_price
            
            yearly_base = yearly_base + trend_factor + random_factor + (yearly_base * stability_factor)
        
        max_allowed = base_price * 1.1
        min_allowed = base_price * 0.9
        if yearly_base > max_allowed:
            yearly_base = max_allowed
        elif yearly_base < min_allowed:
            yearly_base = min_allowed
            
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
