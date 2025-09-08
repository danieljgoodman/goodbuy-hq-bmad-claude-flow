# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "GoodBuy HQ" [level=1] [ref=e5]
      - paragraph [ref=e6]: AI-Powered Business Intelligence
    - generic [ref=e7]:
      - generic [ref=e8]:
        - heading "Welcome Back" [level=3] [ref=e9]
        - paragraph [ref=e10]: Sign in to your GoodBuy HQ account
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email Address
          - textbox "Email Address" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Password
          - textbox "Password" [ref=e18]
        - link "Forgot password?" [ref=e20] [cursor=pointer]:
          - /url: /auth/reset-password
        - button "Signing In..." [disabled] [ref=e21]
        - generic [ref=e22]:
          - text: Don't have an account?
          - link "Sign up" [ref=e23] [cursor=pointer]:
            - /url: /auth/register
  - alert [ref=e24]
```