import requests
import pandas as pd

def search_books(query, max_results=10):
    url = f"https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}"
    response = requests.get(url)

    if response.status_code == 200:
        books_data = response.json().get("items", [])
        book_list = []
        for book in books_data:
            book_info = book.get("volumeInfo", {})
            title = book_info.get("title", "No title")
            authors = book_info.get("authors", ["Unknown author"])
            description = book_info.get("description", "No description")
            book_list.append({
                "Title": title,
                "Authors": ", ".join(authors),
                "Description": description,
                "Link": book_info.get("infoLink", "No link available")
            })

        return pd.DataFrame(book_list)
    else:
        print(f"Error: {response.status_code}")
        return None
