# API Specification

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: GoodBuy HQ API
  version: 1.0.0
  description: AI-powered business valuation and improvement platform API
servers:
  - url: https://goodbuy-hq.vercel.app/api
    description: Production API server
  - url: http://localhost:3000/api
    description: Development server

paths:
  /auth/register:
    post:
      summary: Register new user account
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                businessName:
                  type: string
                industry:
                  type: string
                role:
                  type: string
                  enum: [owner, manager, advisor]
      responses:
        '201':
          description: User created successfully
        '400':
          description: Invalid input data

  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  accessToken:
                    type: string

  /evaluations:
    post:
      summary: Create new business evaluation
      tags: [Evaluations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BusinessData'
      responses:
        '201':
          description: Evaluation created and processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessEvaluation'
        '401':
          description: Unauthorized access

    get:
      summary: Get user's evaluation history
      tags: [Evaluations]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of user evaluations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BusinessEvaluation'

  /evaluations/{id}:
    get:
      summary: Get specific evaluation details
      tags: [Evaluations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Evaluation details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessEvaluation'

  /evaluations/{id}/valuation:
    get:
      summary: Get AI valuation results
      tags: [AI Analysis]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: AI valuation results
          content:
            application/json:
              schema:
                type: object
                properties:
                  valuations:
                    $ref: '#/components/schemas/Valuations'
                  healthScore:
                    type: number
                  confidenceScore:
                    type: number
                  opportunities:
                    type: array
                    items:
                      $ref: '#/components/schemas/ImprovementOpportunity'

  /documents/upload:
    post:
      summary: Upload financial documents for AI analysis
      tags: [Document Intelligence]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                evaluationId:
                  type: string
                documentType:
                  type: string
                  enum: [financial_statement, tax_return, bank_statement, other]
      responses:
        '201':
          description: Document uploaded and processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentAnalysis'

  /improvements/{opportunityId}/guide:
    get:
      summary: Get implementation guide (Premium only)
      tags: [Premium Features]
      security:
        - bearerAuth: []
      parameters:
        - name: opportunityId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Implementation guide
          content:
            application/json:
              schema:
                type: object
                properties:
                  guide:
                    type: string
                  steps:
                    type: array
                    items:
                      type: string
                  resources:
                    type: array
                    items:
                      type: string
        '403':
          description: Premium subscription required

  /subscriptions:
    post:
      summary: Create premium subscription
      tags: [Subscriptions]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                plan:
                  type: string
                  enum: [premium_monthly, premium_annual]
                paymentMethodId:
                  type: string
      responses:
        '201':
          description: Subscription created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        businessName:
          type: string
        industry:
          type: string
        subscriptionTier:
          type: string
          enum: [free, premium, enterprise]

    BusinessData:
      type: object
      properties:
        annualRevenue:
          type: number
        monthlyRecurring:
          type: number
        expenses:
          type: number
        cashFlow:
          type: number
        assets:
          type: number
        liabilities:
          type: number
        customerCount:
          type: number
        marketPosition:
          type: string

    BusinessEvaluation:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        businessData:
          $ref: '#/components/schemas/BusinessData'
        valuations:
          $ref: '#/components/schemas/Valuations'
        healthScore:
          type: number
        confidenceScore:
          type: number
        status:
          type: string
          enum: [processing, completed, failed]
        createdAt:
          type: string
          format: date-time

    Valuations:
      type: object
      properties:
        assetBased:
          type: number
        incomeBased:
          type: number
        marketBased:
          type: number
        weighted:
          type: number
        methodology:
          type: string

    ImprovementOpportunity:
      type: object
      properties:
        id:
          type: string
        category:
          type: string
          enum: [operational, financial, strategic, market]
        title:
          type: string
        description:
          type: string
        impactEstimate:
          type: object
          properties:
            dollarAmount:
              type: number
            percentageIncrease:
              type: number
            confidence:
              type: number
        difficulty:
          type: string
          enum: [low, medium, high]
        priority:
          type: number

    DocumentAnalysis:
      type: object
      properties:
        id:
          type: string
        evaluationId:
          type: string
        fileName:
          type: string
        fileType:
          type: string
        extractedData:
          type: object
        dataQuality:
          type: object
          properties:
            completeness:
              type: number
            accuracy:
              type: number
            confidence:
              type: number
        processingStatus:
          type: string
          enum: [uploaded, processing, completed, failed]

    Subscription:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        plan:
          type: string
          enum: [free, premium_monthly, premium_annual]
        status:
          type: string
          enum: [active, past_due, canceled, trialing]
        currentPeriodEnd:
          type: string
          format: date-time

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```
