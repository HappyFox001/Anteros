import sys

import requests
from rich.console import Console
from rich.panel import Panel

console = Console()


def test_search_trends(keyword):
    """Test the search_trends endpoint with the given keyword"""
    base_url = "http://localhost:8000"
    endpoint = f"/search_trends/{keyword}"

    console.print(f"[bold cyan]Fetching search trends for keyword:[/bold cyan] [yellow]{keyword}[/yellow]")

    try:
        response = requests.get(f"{base_url}{endpoint}")

        if response.status_code == 200:
            data = response.json()
            print_search_trends(data)
            return data
        else:
            console.print(f"[bold red]Error:[/bold red] {response.status_code} - {response.text}")
            return None

    except requests.RequestException as e:
        console.print(f"[bold red]Request Error:[/bold red] {str(e)}")
        return None


def print_search_trends(data):
    """Print the search trends data in a nice format using rich"""
    realtime_data = data["realtime_data"]

    summary = Panel(
        f"[bold]Keyword:[/bold] {data['keyword']}\n"
        f"[bold]Latest Data Point:[/bold] {realtime_data['timestamp']} - Value: {realtime_data['value']}\n"
        f"[bold]Monthly Average:[/bold] {data['monthly_data']}\n"
        f"[bold]Status:[/bold] {data['status']}\n"
        f"[bold]Note:[/bold] {data['note']}",
        title="Search Trends Summary",
        border_style="green",
    )

    console.print(summary)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        keyword = sys.argv[1]
    else:
        keyword = "Python"
        console.print("[yellow]No keyword provided, using default: 'Python'[/yellow]")

    test_search_trends(keyword)
