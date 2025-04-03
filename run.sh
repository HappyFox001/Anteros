#!/bin/bash
conda create -n anteros python=3.9
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动 FastAPI 服务器
python main.py

# 启动前端
cd ..
cd frontend
pnpm dev