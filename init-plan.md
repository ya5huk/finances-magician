/interview I want to create an app that tracks my finances where I can drop my income sheet, spending sheet (pdf), stuff like that - whatever and it'll sum them up in a database and 
  sum them all up in a nice dashboard with maybe future AI predictions and stuff. I want it to be nextjs (latest version) using typesctipt                                               
                                                                                                                                                                                         
  Here is what I want.                                                                                                                                                                   
  First of all - the option to just drop data. the types of data would be - payslip, spending pdf (from my credit card) and either I did some type of action to one of my amounts -      
  pension, education fund, stocks - whether i inputted there money or if I bought or sold a stock, etc.                                                                                  
                                                                                                                                                                                         
  Second of all -dashboards, showing how much my stocks are currently worth, charts for pension, cash, different funds, locked money, etc.                                               
                                                                                                                                                                                         
  There is a lot to do here - so let's start from how our database will look. I want it to be integrated with Supabase (postgreSQL)                                                      
  the docs are here - https://supabase.com/docs                                                                                                                                          
  I want it to require google sign in and allow only one account using google sign in to really sign in (me, the mail will be in .env). The point of this program is to be secure (cuz   
  it's my finances) and not only secure by regular things like always hide API keys and important keys and mails and passwords but I want a smart design. This program will only run by  
  me and only will be connected via the vercel domain that I'll be given. I enter the domain -> Connect with google -> App allows only one mail really -> I enter.                       
                                                                                                                                                                                         
  The db will have RLS.                                                                                                                                                                  
                                                                                                                                                                                         
  The code should be simple.                                                                                                                                                             
                                                                                                                                                                                         
  What data we drop: (all pdfs)                                                                                                                                                          
  - payslips                                                                                                                                                                             
  - payments / expenses                                                                                                                                                                  
  (All of them we can add entries manually, so for payment - the payment name and amount, date... same for payslips)                                                                     
                                                                                                                                                                                         
                                                                                                                                                                                         
  What data we can manually add:                                                                                                                                                         
  - Edit the current free cashflow amount (which should be calculatable but we need a start value)                                                                                       
  - enter data for different funds - pension, locked פקדונות (don't remember the word), education fund                                                                                   
  - enter data for my stocks portfolio - what did I buy, when, what platform -> This should give data to calculate my porfolio with graphs and all                                       
  *This requires live stocks and live currency data. I use shekels, dollars, pounds, euros overall so these should be the currencies that I am able to input in all actions I choose.    
  The portfolio or the whole money amount, can be chosen to be shown at one of those currencies at all times                                                                             
  - Enter data for debt                                                                                                                                                                  
  - Enter notes for all of those inputs if I want to                                                                                                                                     
                                                                                                                                                                                         
                                                                                                                                                                                         
   I would love to know how much I input money into stocks or funds and how much I got now. Over years, it's easy to start forgetting, because you put f.e. 10,000 every Quertar so      
  after couple of years u got 80,000 but u actually put 70,000 but if u don't track it, it's hard to know if u actually put 80 or 70k inside investments  