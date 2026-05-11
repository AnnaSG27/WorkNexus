function getCookie(name: string) {
    let cookieValue: string | undefined = undefined;
  
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
          cookieValue = cookie.substring(name.length + 1);
          break;
        }
      }
    }
  
    return cookieValue ?? undefined;
  }
  
  export function apiFetch(url: string, options: RequestInit = {}) {
    const csrfToken = getCookie("csrftoken");
  
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRFToken": csrfToken }),
        ...(options.headers || {}),
      },
      credentials: "include",
    });
  }